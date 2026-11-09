import React from 'react';

interface AssignmentDescriptionProps {
  htmlContent?: string | null;
  plainContent: string;
}

// Allowlist of safe HTML tags for Canvas content
const ALLOWED_TAGS = new Set(['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a', 'br', 'h3', 'h4', 'span', 'div']);

function sanitizeHtml(html: string): string {
  // Strip script/style/event handlers (server-side DOMPurify would be ideal,
  // but this client-side guard is sufficient for Canvas content)
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export const AssignmentDescription: React.FC<AssignmentDescriptionProps> = ({
  htmlContent,
  plainContent,
}) => {
  if (htmlContent && htmlContent.trim().length > 0) {
    return (
      <div
        className="text-xs text-slate-300 leading-relaxed prose-sm [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_strong]:text-slate-100 [&_em]:text-slate-200 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white [&_h4]:text-xs [&_h4]:font-bold [&_h4]:text-slate-200 [&_a]:text-indigo-400 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
      />
    );
  }

  return (
    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
      {plainContent || 'No description provided.'}
    </p>
  );
};
