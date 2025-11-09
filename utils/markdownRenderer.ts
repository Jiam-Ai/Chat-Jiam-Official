// Renders markdown to HTML for a richer text experience, styled like ChatGPT.
export const renderSimpleMarkdown = (text: string): string => {
    if (!text) return '';

    const applyInlineFormatting = (line: string) => {
        return line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(\*\*|__)(.*?)\1/g, '<strong class="font-semibold text-white">$2</strong>')
            .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`]+?)`/g, '<code class="font-code bg-black/30 px-1 py-0.5 rounded-sm text-sm text-cyan-300">$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">$1</a>');
    };

    const lines = text.split('\n');
    let html = '';
    let inList = null; // can be 'ul' or 'ol'
    let i = 0;

    const closeListIfNeeded = () => {
        if (inList) {
            html += `</${inList}>`;
            inList = null;
        }
    };

    while (i < lines.length) {
        const line = lines[i];

        const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
        if (headingMatch) {
            closeListIfNeeded();
            const level = headingMatch[1].length;
            const content = applyInlineFormatting(headingMatch[2]);
            const size = level === 1 ? 'text-xl mt-5 mb-3' : level === 2 ? 'text-lg mt-4 mb-2' : 'text-base mt-3 mb-1';
            html += `<h${level} class="${size} font-semibold text-white">${content}</h${level}>`;
            i++;
            continue;
        }

        const blockquoteMatch = line.match(/^>\s?(.*)/);
        if (blockquoteMatch) {
            closeListIfNeeded();
            let quoteContent = [applyInlineFormatting(blockquoteMatch[1])];
            while (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
                i++;
                quoteContent.push(applyInlineFormatting(lines[i].substring(1).trim()));
            }
            html += `<blockquote class="border-l-4 border-cyan-500/50 pl-4 my-3 text-gray-300 italic bg-black/25 py-2 whitespace-pre-wrap">${quoteContent.join('\n')}</blockquote>`;
            i++;
            continue;
        }
        
        if (line.match(/^[-*_]{3,}$/)) {
            closeListIfNeeded();
            html += '<hr class="my-4 border-gray-600"/>';
            i++;
            continue;
        }

        const ulMatch = line.match(/^(\s*)[\-*]\s+(.*)/);
        if (ulMatch) {
            if (inList !== 'ul') {
                closeListIfNeeded();
                html += '<ul class="list-disc list-outside space-y-2 my-3 pl-6">';
                inList = 'ul';
            }
            html += `<li>${applyInlineFormatting(ulMatch[2])}</li>`;
            i++;
            continue;
        }
        
        const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
        if (olMatch) {
            if (inList !== 'ol') {
                closeListIfNeeded();
                html += '<ol class="list-decimal list-outside space-y-2 my-3 pl-6">';
                inList = 'ol';
            }
            html += `<li>${applyInlineFormatting(olMatch[2])}</li>`;
            i++;
            continue;
        }

        if (line.trim() !== '') {
            closeListIfNeeded();
            let paragraphLines = [line];
            while (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (nextLine.trim() === '' || 
                    nextLine.match(/^(#{1,3}\s+.*|>\s?.*|[-*_]{3,}|(\s*)[\-*]\s+.*|(\s*)\d+\.\s+.*)/)) {
                    break;
                }
                paragraphLines.push(nextLine);
                i++;
            }
            html += `<p class="my-2 leading-relaxed">${applyInlineFormatting(paragraphLines.join('\n'))}</p>`;
            i++;
            continue;
        }
        
        closeListIfNeeded();
        i++;
    }
    
    closeListIfNeeded();

    return html;
};