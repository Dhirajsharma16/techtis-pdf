/**
 * TechTis Text & Writing Tools Engine
 * 100% In-Browser RAM Execution | Zero Server Dependencies
 * Tools: Word & Character Counter, Case Converter, Lorem Ipsum Generator, Markdown to HTML
 */

// ==============================================================================
// 1. Word, Character & Text Statistics Counter
// ==============================================================================
export const WordCounterEngine = {
    analyze(text = '') {
        const str = String(text || '');
        if (!str.trim()) {
            return {
                words: 0,
                charsWithSpaces: 0,
                charsNoSpaces: 0,
                sentences: 0,
                paragraphs: 0,
                readingTimeMin: 0,
                speakingTimeMin: 0,
                keywords: []
            };
        }

        const wordsArray = str.trim().match(/[\w'-]+/g) || [];
        const words = wordsArray.length;
        const charsWithSpaces = str.length;
        const charsNoSpaces = str.replace(/\s+/g, '').length;
        const sentences = (str.match(/[^.!?]+[.!?]+/g) || [str]).length;
        const paragraphs = str.split(/\n+/).filter(p => p.trim().length > 0).length;

        // Reading speed: ~200 words per minute
        const readingTimeMin = Math.max(1, Math.ceil(words / 200));
        const readingTimeSec = Math.max(1, Math.round((words / 200) * 60));
        // Speaking speed: ~130 words per minute
        const speakingTimeMin = Math.max(1, Math.ceil(words / 130));

        // Keyword density
        const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'that', 'for', 'it', 'as', 'was', 'with', 'on', 'at', 'by', 'this', 'an', 'be', 'or', 'from']);
        const freqMap = {};
        wordsArray.forEach(w => {
            const clean = w.toLowerCase();
            if (clean.length > 2 && !stopWords.has(clean)) {
                freqMap[clean] = (freqMap[clean] || 0) + 1;
            }
        });

        const keywords = Object.entries(freqMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([word, count]) => ({
                word,
                count,
                percentage: Math.round((count / Math.max(1, words)) * 100)
            }));

        return {
            words,
            charsWithSpaces,
            charsNoSpaces,
            sentences,
            paragraphs,
            readingTimeMin: words > 0 ? readingTimeMin : 0,
            readingTimeSec: words > 0 ? readingTimeSec : 0,
            speakingTimeMin: words > 0 ? speakingTimeMin : 0,
            keywords,
            topKeywords: keywords
        };
    }
};

// ==============================================================================
// 2. Case Converter (Text Transform)
// ==============================================================================
export const CaseConverterEngine = {
    toUpper(str) {
        return str.toUpperCase();
    },

    toLower(str) {
        return str.toLowerCase();
    },

    toTitle(str) {
        return str.toLowerCase().replace(/(^|\s|-|\/)\S/g, match => match.toUpperCase());
    },

    toSentence(str) {
        return str.toLowerCase().replace(/(^\s*|[.!?]\s+)(\w)/g, (match, prefix, char) => prefix + char.toUpperCase());
    },

    toCamel(str) {
        return str
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^[A-Z]/, c => c.toLowerCase());
    },

    toPascal(str) {
        const camel = this.toCamel(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    },

    toSnake(str) {
        return str
            .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
            ?.map(s => s.toLowerCase())
            .join('_') || str.toLowerCase().replace(/[\s-]+/g, '_');
    },

    toKebab(str) {
        return str
            .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
            ?.map(s => s.toLowerCase())
            .join('-') || str.toLowerCase().replace(/[\s_]+/g, '-');
    },

    toConstant(str) {
        return this.toSnake(str).toUpperCase();
    },

    toDot(str) {
        return this.toKebab(str).replace(/-/g, '.');
    }
};

// ==============================================================================
// 3. Lorem Ipsum Placeholder Text Generator
// ==============================================================================
const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'curabitur', 'vel',
    'hendrerit', 'libero', 'eleifend', 'blandit', 'nunc', 'ornare', 'odio', 'ut', 'orci', 'gravida',
    'imperdiet', 'nullam', 'purus', 'lacinia', 'a', 'pretium', 'quis', 'congue', 'praesent', 'sagittis',
    'laoreet', 'auctor', 'mauris', 'non', 'velit', 'eros', 'dictum', 'proin', 'accumsan', 'sapien',
    'nec', 'massa', 'volutpat', 'venenatis', 'sed', 'eu', 'molestie', 'lacus', 'quisque', 'porttitor',
    'ligula', 'dui', 'mollis', 'tempus', 'at', 'magna', 'vestibulum', 'turpis', 'ac', 'diam',
    'tincidunt', 'id', 'condimentum', 'enim', 'sodales', 'in', 'hac', 'habitasse', 'platea', 'dictumst',
    'aenean', 'neque', 'fusce', 'augue', 'leo', 'eget', 'semper', 'mattis', 'tortor', 'scelerisque'
];

export const LoremIpsumEngine = {
    generateSentence() {
        const len = Math.floor(Math.random() * 10) + 8;
        const words = [];
        for (let i = 0; i < len; i++) {
            words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
        }
        const s = words.join(' ');
        return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    },

    generateParagraph(sentencesCount = 5) {
        const sentences = [];
        for (let i = 0; i < sentencesCount; i++) {
            sentences.push(this.generateSentence());
        }
        return sentences.join(' ');
    },

    generate(type = 'paragraphs', count = 3, startWithLorem = true, wrapTags = false) {
        let result = [];
        count = Math.max(1, Math.min(50, count));

        if (type === 'paragraphs') {
            for (let i = 0; i < count; i++) {
                let p = this.generateParagraph();
                if (i === 0 && startWithLorem) {
                    p = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + p;
                }
                result.push(wrapTags ? `<p>${p}</p>` : p);
            }
            return result.join(wrapTags ? '\n' : '\n\n');
        }

        if (type === 'sentences') {
            for (let i = 0; i < count; i++) {
                result.push(this.generateSentence());
            }
            return result.join(' ');
        }

        if (type === 'words') {
            const words = [];
            for (let i = 0; i < count; i++) {
                words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
            }
            if (startWithLorem && count >= 5) {
                words[0] = 'lorem'; words[1] = 'ipsum'; words[2] = 'dolor'; words[3] = 'sit'; words[4] = 'amet';
            }
            return words.join(' ');
        }

        if (type === 'list') {
            const items = [];
            for (let i = 0; i < count; i++) {
                items.push(`<li>${this.generateSentence()}</li>`);
            }
            return `<ul>\n  ${items.join('\n  ')}\n</ul>`;
        }

        return '';
    },

    generateParagraphs(count = 3, wrapTags = false) {
        return this.generate('paragraphs', count, true, wrapTags);
    },

    generateWords(count = 25) {
        return this.generate('words', count, true);
    }
};

// ==============================================================================
// 4. Markdown to HTML Converter
// ==============================================================================
export const MarkdownEngine = {
    parse(md = '') {
        if (!md) return '';
        let html = md;

        // Fenced code blocks
        html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (_, lang, code) => {
            const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre class="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs overflow-x-auto font-mono my-3"><code>${escaped}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

        // Headings
        html = html.replace(/^###### (.*$)/gim, '<h6 class="text-xs font-bold text-slate-900 mt-3 mb-1">$1</h6>');
        html = html.replace(/^##### (.*$)/gim, '<h5 class="text-sm font-bold text-slate-900 mt-3 mb-1">$1</h5>');
        html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-bold text-slate-900 mt-4 mb-1.5">$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-extrabold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-200">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">$1</h1>');

        // Blockquotes
        html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-red-500 pl-3.5 py-1 text-slate-600 italic my-2 bg-slate-50 rounded-r-lg">$1</blockquote>');

        // Horizontal Rules
        html = html.replace(/^(?:---|\*\*\*|___)$/gim, '<hr class="my-4 border-slate-200">');

        // Bold & Italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-slate-400">$1</del>');

        // Links & Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-w-full my-2 shadow-xs">');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-red-600 font-semibold underline hover:text-red-700">$1</a>');

        // Unordered lists
        html = html.replace(/^\s*[-*+]\s+(.*)$/gim, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>');

        // Ordered lists
        html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ml-4 list-decimal text-slate-700 my-0.5">$1</li>');

        // Wrap consecutive <li> into <ul> or <ol>
        html = html.replace(/((?:<li class="[^"]*list-disc[^"]*">.*?<\/li>\s*)+)/gis, '\n\n<ul class="my-2 space-y-1">\n$1</ul>\n\n');
        html = html.replace(/((?:<li class="[^"]*list-decimal[^"]*">.*?<\/li>\s*)+)/gis, '\n\n<ol class="my-2 space-y-1">\n$1</ol>\n\n');

        // Paragraphs
        const blocks = html.split(/\n\s*\n/);
        html = blocks.map(b => {
            const trimmed = b.trim();
            if (!trimmed) return '';
            if (/^<(h[1-6]|pre|blockquote|hr|ul|ol|li|img)/i.test(trimmed)) return trimmed;
            return `<p class="my-2 text-slate-700 leading-relaxed">${trimmed.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');

        return html;
    },

    toHtml(md = '') {
        return this.parse(md);
    }
};
