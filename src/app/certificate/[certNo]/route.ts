import { renderCertificate } from "@/lib/certificate";
import { certificateByNo, resultsLive } from "@/lib/results";

export async function GET(_req: Request, ctx: RouteContext<"/certificate/[certNo]">) {
  const { certNo } = await ctx.params;
  if (!(await resultsLive(Date.now()))) {
    return new Response("Certificates are available after results are announced.", { status: 403 });
  }
  const cert = await certificateByNo(decodeURIComponent(certNo));
  if (!cert || !cert.award || !cert.certNo) return new Response("Certificate not found", { status: 404 });
  const bytes = await renderCertificate({ ...cert, certNo: cert.certNo, award: cert.award });
  const filename = `${cert.studentName.replace(/[^A-Za-z0-9]+/g, "-")}-${cert.certNo}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
