import { extractImageMetadata } from "@/shared/lib/image-color";
import { createdId, get, request } from "@/shared/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { components } from "api-types";
export type Note = components["schemas"]["NoteView"];
export type NoteFile = Note["files"][number];
export const notesOptions = (projectId?: string, q = "", personal = false, sort = "created-desc", archive = "active", tag = "") =>
  infiniteQueryOptions({
    queryKey: ["notes", "list", projectId ?? null, personal, q, sort, archive, tag],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      const search = new URLSearchParams({ offset: String(pageParam), q, sort, archive, tag });
      if (personal) search.set("scope", "personal");
      if (projectId) search.set("projectId", projectId);
      return get<components["schemas"]["NotePage"]>("/notes?" + search, signal);
    },
    getNextPageParam: (page) => page.nextOffset ?? undefined,
  });
export const noteOptions = (id: string) =>
  queryOptions({
    queryKey: ["notes", "detail", id],
    queryFn: ({ signal }) =>
      get<Note>("/notes/" + encodeURIComponent(id), signal),
  });
export async function createNote(
  body: string,
  projectId: string | null,
  objectKeys: string[],
) {
  return createdId(
    (
      await request("/notes", {
        method: "POST",
        body: JSON.stringify({ body, projectId, objectKeys }),
      })
    ).location,
  );
}
export const editNote = (id: string, body: string) =>
  request("/notes/" + id, { method: "PATCH", body: JSON.stringify({ body }) });
export const connectNote = (id: string, projectId: string | null) =>
  request("/notes/" + id + "/project", {
    method: "PUT",
    body: JSON.stringify({ projectId }),
  });
export const shareNote = (id: string, shared: boolean) =>
  request("/notes/" + id + "/sharing", {
    method: "PUT",
    body: JSON.stringify({ shared }),
  });
export const deleteNote = (id: string) =>
  request("/notes/" + id, { method: "DELETE" });
export const detachNoteFile = (id: string, fileId: string) =>
  request("/notes/" + id + "/files/" + fileId, { method: "DELETE" });
export async function prepareNoteFile(file: File) {
  const contentType = file.type || "application/octet-stream";
  const { data } = await request<{ objectKey: string; url: string }>(
    "/attachments/presign",
    {
      method: "POST",
      body: JSON.stringify({
        slot: "NOTE_FILES",
        fileName: file.name,
        contentType,
        size: file.size,
        ...await extractImageMetadata(file),
      }),
    },
  );
  const url = new URL(data.url);
  const target =
    import.meta.env.DEV && url.origin === import.meta.env.DEV_STORAGE_ORIGIN
      ? "/__storage" + url.pathname + url.search
      : data.url;
  const result = await fetch(target, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
    credentials: "omit",
  });
  if (!result.ok) throw new Error(file.name + " 파일을 업로드하지 못했습니다.");
  return data.objectKey;
}
export async function attachNoteFile(id: string, file: File) {
  const objectKey = await prepareNoteFile(file);
  await request("/notes/" + id + "/files", {
    method: "POST",
    body: JSON.stringify({ objectKey }),
  });
}

export const archiveNote = (id: string, archived: boolean) => request('/notes/'+id+'/archive', {method:'PUT',body:JSON.stringify({archived})});
export const setNoteTags = (id: string, tags: string[]) => request('/notes/'+id+'/tags', {method:'PUT',body:JSON.stringify({tags})});
