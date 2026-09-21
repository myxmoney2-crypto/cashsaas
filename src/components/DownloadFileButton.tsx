"use client";

/** Télécharge un fichier généré tel quel (le contenu est créé dans le navigateur, rien n'est envoyé). */
export function DownloadFileButton({ path, content }: { path: string; content: string }) {
  const filename = path.split("/").pop() || path;

  function download() {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border border-white/20 text-foreground hover:bg-white/5 transition-colors"
    >
      Télécharger {filename}
    </button>
  );
}
