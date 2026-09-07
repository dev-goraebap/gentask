#!/usr/bin/env python3
"""v0.3.0 데이터를 Flyway로 초기화한 빈 DB에 옮기고 모든 행을 대조한다."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


def run(command, data=None):
    result = subprocess.run(command, input=data, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"명령 실패: {command[0]} (종료 코드 {result.returncode})")
    return result.stdout.strip()


def nanoid(kind, old):
    digest = hashlib.sha256(f"gentask:v030:{kind}:{old}".encode()).digest()
    return base64.urlsafe_b64encode(digest).decode()[:12]


def transform(source, qa):
    result = {key: [dict(row) for row in rows] for key, rows in source.items()}
    projects = {row['id']: row['public_id'] for row in source['projects']}
    folders = {row['id']: nanoid('folder', row['id']) for row in source['document_folders']}
    artifacts = {row['id']: nanoid('artifact', row['id']) for row in source['documents']}
    for mapping in (projects, folders, artifacts):
        assert len(set(mapping.values())) == len(mapping), 'ID 충돌'
        assert all(re.fullmatch(r'[A-Za-z0-9_-]{12}', value) for value in mapping.values())
    for row in result['projects']:
        row['id'] = projects[row['id']]
        del row['public_id'], row['next_number']
    for old_table, new_table, mapping in (
        ('document_folders', 'artifact_folders', folders), ('documents', 'artifacts', artifacts)
    ):
        result[new_table] = result.pop(old_table)
        for row in result[new_table]:
            row['id'] = mapping[row['id']]
            row['project_id'] = projects[row['project_id']]
            row['owner_id'] = None
            for field in ('parent_id', 'folder_id'):
                if field in row:
                    row[field] = folders.get(row[field])
    result['artifact_revisions'] = result.pop('document_revisions')
    for row in result['artifact_revisions']:
        row['artifact_id'] = artifacts[row.pop('document_id')]
    for row in result['tasks']:
        row.update(project_id=None, assignee_id=None, state='DONE' if row['completed_at'] else 'TODO')
    for issue in result.pop('issues'):
        state = issue['state']
        done = state in ('COMPLETED', 'CANCELED')
        metadata = {key: issue[key] for key in ('number', 'kind', 'state', 'parent_id', 'ordinal')}
        note = (issue['body'] or '') + '\n\n이전 이슈 정보: ' + json.dumps(metadata, ensure_ascii=False)
        assert len(note) <= 2000, '이슈 본문이 작업 길이 제한을 초과함'
        result['tasks'].append(dict(
            id=issue['id'], project_id=projects[issue['project_id']], assignee_id=None,
            state='DONE' if done else 'IN_PROGRESS' if state == 'STARTED' else 'TODO',
            title=issue['title'], note=note, due_date=issue['due_date'], remind_at=None,
            important=False, my_day_on=None,
            completed_at=(issue['closed_at'] or issue['updated_at']) if done else None,
            created_at=issue['created_at'], updated_at=issue['updated_at'], user_id=issue['author_id']))
    if qa:
        for table in ('sessions', 'api_tokens', 'verification_codes', 'push_subscriptions',
                      'push_delivery_failures', 'sent_reminders', 'pending_uploads'):
            result[table] = []
    return result, dict(projects=projects, folders=folders, artifacts=artifacts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--target', required=True)
    parser.add_argument('--backup-dir', required=True)
    parser.add_argument('--docker', default='/snap/bin/docker')
    parser.add_argument('--qa', action='store_true')
    args = parser.parse_args()
    assert args.source != args.target
    assert all(re.fullmatch(r'[a-z][a-z0-9_]+', name) for name in (args.source, args.target))
    os.umask(0o077)
    backup = Path(args.backup_dir)
    backup.mkdir(parents=True, exist_ok=True)
    config = json.loads(run([args.docker, 'inspect', 'my-postgres']))[0]
    env = dict(item.split('=', 1) for item in config['Config']['Env'] if '=' in item)
    user = env.get('POSTGRES_USER', 'postgres')

    def sql(db, statement):
        return run([args.docker, 'exec', '-i', 'my-postgres', 'psql', '-X', '-qAt',
                    '-U', user, '-d', db, '-v', 'ON_ERROR_STOP=1'], statement)

    source_tables = json.loads(sql(args.source, "SELECT json_agg(tablename ORDER BY tablename) "
        "FROM pg_tables WHERE schemaname='public' AND tablename <> 'flyway_schema_history';"))
    query = ','.join(f"'{table}',(SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM {table} t)"
                     for table in source_tables)
    source = json.loads(sql(args.source, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; '
                            f'SELECT jsonb_build_object({query}); COMMIT;'))
    (backup / 'source.json').write_text(json.dumps(source, ensure_ascii=False), encoding='utf-8')
    target, mapping = transform(source, args.qa)
    (backup / 'id-map.json').write_text(json.dumps(mapping, indent=2), encoding='utf-8')
    target_tables = json.loads(sql(args.target, "SELECT json_agg(tablename ORDER BY tablename) "
        "FROM pg_tables WHERE schemaname='public' AND tablename <> 'flyway_schema_history';"))
    assert set(target).issubset(target_tables), '대상 스키마가 다름'
    assert sql(args.target, 'SELECT ' + '+'.join(f'(SELECT count(*) FROM {t})' for t in target_tables)) == '0', '대상 DB가 비어 있지 않음'
    statements = ['BEGIN;']
    constraints = json.loads(sql(args.target, "SELECT json_agg(json_build_array(conrelid::regclass::text,conname)) FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace;"))
    for table, name in constraints:
        statements.append(f'ALTER TABLE {table} ALTER CONSTRAINT {name} DEFERRABLE INITIALLY DEFERRED;')
    for table, rows in target.items():
        if not rows:
            continue
        payload = json.dumps(rows, ensure_ascii=False).replace("'", "''")
        statements.append(f"INSERT INTO {table} SELECT * FROM jsonb_populate_recordset(NULL::{table}, '{payload}'::jsonb);")
        statements.append(f"DO $$ BEGIN IF EXISTS ((SELECT * FROM {table} EXCEPT SELECT * FROM jsonb_populate_recordset(NULL::{table}, '{payload}'::jsonb)) UNION ALL (SELECT * FROM jsonb_populate_recordset(NULL::{table}, '{payload}'::jsonb) EXCEPT SELECT * FROM {table})) THEN RAISE EXCEPTION '행 불일치: {table}'; END IF; END $$;")
    statements.append('SET CONSTRAINTS ALL IMMEDIATE;')
    for table, name in constraints:
        statements.append(f'ALTER TABLE {table} ALTER CONSTRAINT {name} NOT DEFERRABLE;')
    statements.append('COMMIT;')
    sql(args.target, '\n'.join(statements))
    counts = {table: len(rows) for table, rows in target.items()}
    (backup / 'verified-counts.json').write_text(json.dumps(counts, indent=2), encoding='utf-8')
    print(json.dumps(dict(target=args.target, verified=counts, mapping=str(backup / 'id-map.json'))))


if __name__ == '__main__':
    main()
