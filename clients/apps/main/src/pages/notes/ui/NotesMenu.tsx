import { BrandMark } from "@/shared/ui/brand";
import { MobileSurface } from "@/shared/ui/mobile";
import { ThemeToggle } from "@/shared/ui/theme";
import {
  HgiArtifacts,
  HgiFolder,
  HgiNote,
  HgiTask,
  HgiUser,
  HgiViewList,
} from "@/shared/ui/icons";
import {
  Button,
  DialogHeader,
  HStack,
  Layout,
  LayoutContent,
  SideNavItem,
  VStack,
} from "@astryxdesign/core";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
export function NotesMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = [
    { label: "메모", path: "/notes", icon: <HgiNote /> },
    { label: "작업", path: "/tasks", icon: <HgiTask /> },
    { label: "아티팩트", path: "/artifacts", icon: <HgiArtifacts /> },
    { label: "프로젝트", path: "/projects", icon: <HgiFolder /> },
    { label: "계정", path: "/me", icon: <HgiUser /> },
  ] as const;
  return (
    <>
      <Button
        label="전체 메뉴"
        isIconOnly
        icon={<HgiViewList />}
        variant="ghost"
        onClick={() => setOpen(true)}
      />
      <MobileSurface
        title="전체 메뉴"
        isOpen={open}
        onOpenChange={setOpen}
        padding={0}
      >
        <Layout
          padding={0}
          height="auto"
          header={<DialogHeader title="전체 메뉴" onOpenChange={setOpen} />}
          content={
            <LayoutContent>
              <VStack gap={2}>
                <HStack align="center" justify="between">
                  <BrandMark size={40} />
                  <ThemeToggle />
                </HStack>
                <VStack gap={0}>
                  {items.map((item) => (
                    <SideNavItem
                      key={item.path}
                      label={item.label}
                      icon={item.icon}
                      isSelected={item.path === "/notes"}
                      onClick={() => {
                        setOpen(false);
                        void navigate({ to: item.path });
                      }}
                    />
                  ))}
                </VStack>
              </VStack>
            </LayoutContent>
          }
        />
      </MobileSurface>
    </>
  );
}
