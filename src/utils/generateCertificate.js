import { jsPDF } from 'jspdf';

/**
 * Gera e realiza o download do certificado de conclusão em formato PDF
 * com orientação paisagem (A4 landscape) utilizando jsPDF.
 */
export function generateCourseCertificate({
  studentName = 'Estudante',
  courseTitle = 'Curso de Capacitação',
  courseCode = 'LMS',
  teacherName = 'Professor(a) Responsável',
  completionDate = new Date(),
  workloadHours = 40
}) {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // 1. Fundo suave
  doc.setFillColor(252, 252, 254);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Moldura externa Azul Marinho
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 3. Moldura interna Dourada
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  // Cantoneiras decorativas elegantes
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(16, 23, 23, 16);
  doc.line(pageWidth - 23, 16, pageWidth - 16, 23);
  doc.line(16, pageHeight - 23, 23, pageHeight - 16);
  doc.line(pageWidth - 23, pageHeight - 16, pageWidth - 16, pageHeight - 23);

  // 4. Cabeçalho Institucional
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SISTEMA DE GESTÃO DE APRENDIZAGEM • MINI MOODLE LMS', pageWidth / 2, 28, { align: 'center' });

  // 5. Título: CERTIFICADO DE CONCLUSÃO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(30, 58, 138);
  doc.text('CERTIFICADO DE CONCLUSÃO', pageWidth / 2, 44, { align: 'center' });

  // Faixa decorativa dourada abaixo do título
  doc.setFillColor(217, 119, 6);
  doc.rect(pageWidth / 2 - 35, 48, 70, 1.4, 'F');

  // 6. Texto introdutório
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Certificamos com mérito que o(a) estudante', pageWidth / 2, 63, { align: 'center' });

  // 7. Nome do Estudante em Destaque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName.toUpperCase(), pageWidth / 2, 77, { align: 'center' });

  // Linha abaixo do nome
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 65, 81, pageWidth / 2 + 65, 81);

  // 8. Descrição de cumprimento pedagógico
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'concluiu com aproveitamento de 100% todas as atividades obrigatórias, leituras,',
    pageWidth / 2,
    91,
    { align: 'center' }
  );
  doc.text(
    'tarefas práticas e avaliações formativas pertinentes ao curso:',
    pageWidth / 2,
    98,
    { align: 'center' }
  );

  // 9. Nome do Curso
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(2, 132, 199); // Azul real
  const splitTitle = doc.splitTextToSize(courseTitle, 220);
  doc.text(splitTitle, pageWidth / 2, 111, { align: 'center' });

  const titleOffset = (splitTitle.length - 1) * 7;
  const metaY = 120 + titleOffset;

  // 10. Código e Carga Horária
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Código da Disciplina: ${courseCode || 'LMS'}  •  Carga Horária: ${workloadHours} horas  •  Progresso: 100% Concluído`,
    pageWidth / 2,
    metaY,
    { align: 'center' }
  );

  // 11. Data de Emissão
  const dateObj = completionDate ? new Date(completionDate) : new Date();
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Emitido em ${formattedDate}`, pageWidth / 2, metaY + 7, { align: 'center' });

  // 12. Seção de Assinaturas
  const signY = 166;

  // Assinatura do Professor
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(45, signY, 115, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(teacherName, 80, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Docente Responsável', 80, signY + 10, { align: 'center' });

  // Assinatura da Coordenação
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(pageWidth - 115, signY, pageWidth - 45, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Coordenação Pedagógica', pageWidth - 80, signY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Diretoria de Certificação LMS', pageWidth - 80, signY + 10, { align: 'center' });

  // 13. Código de Validação / Registro Acadêmico no Rodapé
  const hashNum = Math.abs(
    studentName.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  );
  const certCode = `CERT-${(courseCode || 'LMS').replace(/[^a-zA-Z0-9]/g, '')}-${hashNum.toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Código de Registro e Autenticidade: ${certCode}`, pageWidth / 2, pageHeight - 16, { align: 'center' });

  // 14. Download do Arquivo PDF
  const cleanStudent = studentName.trim().replace(/\s+/g, '_');
  const cleanCode = (courseCode || 'Curso').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Certificado_${cleanCode}_${cleanStudent}.pdf`);
}
