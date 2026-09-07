#!/usr/bin/env python3
"""서버에서 커밋별 이미지를 배포하고 기동 확인 후 릴리스 정보를 기록한다."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

sha, tag = sys.argv[1:]
assert re.fullmatch(r'[0-9a-f]{40}', sha)
assert re.fullmatch(r'v\d+\.\d+\.\d+(?:-rc\.\d+)?', tag)
app = Path(__file__).resolve().parent.parent
docker = '/snap/bin/docker' if Path('/snap/bin/docker').exists() else 'docker'
image = f'gentask-api:{sha}'
env = dict(os.environ, GENTASK_IMAGE=image)


def run(*args, **kwargs):
    return subprocess.check_output([docker, *args], cwd=app, env=env, text=True, **kwargs).strip()


compose = json.loads(run('compose', 'config', '--format', 'json'))
services = compose['services']
assert len(services) == 1, 'Gentask 전용 Compose 파일이 필요함'
service = next(iter(services.values()))
assert service['image'] == image, 'Compose image에 ${GENTASK_IMAGE}를 설정해야 함'
container = service['container_name']
release = app / 'api' / 'releases' / sha
jar_hash = hashlib.sha256((release / 'app.jar').read_bytes()).hexdigest()
exists = subprocess.run([docker, 'image', 'inspect', image], capture_output=True).returncode == 0
if exists:
    labels = json.loads(run('image', 'inspect', image))[0]['Config']['Labels'] or {}
    assert labels.get('gentask.jar.sha256') == jar_hash, '같은 커밋의 JAR가 달라 재사용할 수 없음'
else:
    run('build', '--label', f'gentask.jar.sha256={jar_hash}', '--label', f'org.opencontainers.image.revision={sha}', '-t', image, str(release))
run('compose', 'up', '-d', '--no-build')
for attempt in range(60):
    probe = subprocess.run([docker, 'exec', container, 'wget', '-S', '-O', '/dev/null',
                            'http://127.0.0.1:8080/api/v1/me'], capture_output=True, text=True)
    if 'HTTP/1.1 401' in probe.stderr:
        break
    time.sleep(2)
else:
    raise RuntimeError('API가 120초 안에 준비되지 않음. 릴리스 정보를 갱신하지 않음')
settings = app / '.env'
lines = [line for line in settings.read_text().splitlines() if not line.startswith('GENTASK_IMAGE=')]
settings.write_text('\n'.join([*lines, f'GENTASK_IMAGE={image}']) + '\n')
for name, value in (('RELEASE_SHA', sha), ('RELEASE_TAG', tag)):
    (app / 'api' / name).write_text(value + '\n')
print(f'{container}: {tag} ({sha[:7]}) 준비됨')
