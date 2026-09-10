export function safeImageUrl(url: string) { return /^(https?:|data:image\/(png|jpeg|gif|webp);base64,|\/(?!\/))/i.test(url) ? url : ''; }
