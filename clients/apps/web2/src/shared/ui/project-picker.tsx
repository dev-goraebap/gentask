import { BottomSheet, Text } from '@astryxdesign/core';
import { useNavigate } from '@tanstack/react-router';
import { ChevronsUpDown, Layers } from 'lucide-react';
import { useState } from 'react';
import type { ProjectView } from '@/shared/api/client';
import { ROUTES } from '@/shared/config/routes';

interface ProjectPickerProps {
  readonly projects: readonly ProjectView[];
  readonly current: ProjectView;
}

/**
 * 사이드바 머리 아래에 서는 프로젝트 고르개.
 *
 * 트래커의 메뉴는 프로젝트에 매이므로 어느 프로젝트를 보는지가 메뉴보다 위에 있어야 한다.
 */
export function ProjectPicker({ projects, current }: ProjectPickerProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="project-picker"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Layers aria-hidden />
        <span className="name">
          <Text as="span">{current.name}</Text>
        </span>
        <ChevronsUpDown aria-hidden />
      </button>

      <BottomSheet label="프로젝트 고르기" isOpen={open} onOpenChange={setOpen}>
        <div className="more-sheet">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                setOpen(false);
                void navigate({ to: ROUTES.issues(project.id) });
              }}
            >
              <Layers aria-hidden />
              <span>
                {project.name} · {project.key}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void navigate({ to: ROUTES.projects() });
            }}
          >
            <span>프로젝트 목록으로</span>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
