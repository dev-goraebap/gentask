import { useCurrentEditor } from "@tiptap/react"

export function useEditorPortal() {
  const { editor } = useCurrentEditor()
  return editor?.view.dom.closest("dialog") ?? undefined
}
