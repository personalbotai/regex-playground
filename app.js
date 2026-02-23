// Regex Playground Application
class RegexPlayground {
    constructor() {
        this.patternInput = document.getElementById('regex-pattern');
        this.testStringInput = document.getElementById('test-string');
        this.highlightOutput = document.getElementById('highlighted-output');
        this.matchesTable = document.getElementById('matches-table');
        this.matchCount = document.getElementById('match-count');
        this.groupCount = document.getElementById('group-count');
        this.execTime = document.getElementById('exec-time');
        this.charCount = document.getElementById('char-count');
        
        this.currentFlags = new Set(['g']);
        this.lastRegex = null;
        
        this.bindEvents();
        this.loadFromUrl();
    }

    bindEvents() {
        this.testStringInput.addEventListener('input', () => {
            this.charCount.textContent = this.testStringInput.value.length;
            if (this.lastRegex) this.testRegex();
        });
        
        this.patternInput.addEventListener('input', () => {
            if (this.lastRegex) this.testRegex();
        });
        
        // Update URL on pattern change for sharing
        this.patternInput.addEventListener('change', () => this.updateUrl());
    }

    toggleFlag(flag) {
        const btn = document.getElementById(`flag-${flag}`);
        if (this.currentFlags.has(flag)) {
            this.currentFlags.delete(flag);
            btn.classList.remove('active');
        } else {
            this.currentFlags.add(flag);
            btn.classList.add('active');
        }
        if (this.lastRegex) this.testRegex();
        this.updateUrl();
    }

    getFlagsString() {
        return Array.from(this.currentFlags).join('');
    }

    testRegex() {
        const pattern = this.patternInput.value.trim();
        const text = this.testStringInput.value;
        const flags = this.getFlagsString();
        
        if (!pattern) {
            this.clearResults();
            return;
        }
        
        try {
            const regex = new RegExp(pattern, flags);
            this.lastRegex = regex;
            
            const start = performance.now();
            const matches = [];
            let match;
            
            if (flags.includes('g')) {
                while ((match = regex.exec(text)) !== null) {
                    matches.push({
                        match: match[0],
                        groups: match.slice(1),
                        index: match.index,
                        length: match[0].length
                    });
                    // Prevent infinite loops on zero-length matches
                    if (match[0].length === 0) {
                        regex.lastIndex++;
                    }
                }
            } else {
                match = regex.exec(text);
                if (match) {
                    matches.push({
                        match: match[0],
                        groups: match.slice(1),
                        index: match.index,
                        length: match[0].length
                    });
                }
            }
            
            const end = performance.now();
            this.displayResults(matches, text, pattern, end - start);
            
        } catch (err) {
            this.showError(err.message);
        }
    }

    displayResults(matches, text, pattern, time) {
        // Update stats
        this.matchCount.textContent = matches.length;
        const totalGroups = matches.reduce((sum, m) => sum + m.groups.length, 0);
        this.groupCount.textContent = totalGroups;
        this.execTime.textContent = time.toFixed(2) + 'ms';
        
        // Highlight text
        this.highlightOutput.innerHTML = this.buildHighlightedText(text, matches, pattern);
        
        // Build table
        this.matchesTable.innerHTML = matches.map((m, i) => `
            <tr class="border-b border-gray-700 hover:bg-gray-700/50">
                <td class="py-2 px-3 text-gray-400">${i + 1}</td>
                <td class="py-2 px-3 font-mono text-yellow-300">${this.escapeHtml(m.match)}</td>
                <td class="py-2 px-3 text-sm">
                    ${m.groups.length > 0 ? 
                        m.groups.map((g, idx) => `<span class="text-blue-300">$${idx+1}: ${this.escapeHtml(g)}</span>`).join(' ') : 
                        '<span class="text-gray-500">-</span>'}
                </td>
                <td class="py-2 px-3 text-gray-400">${m.index}</td>
            </tr>
        `).join('');
        
        if (matches.length === 0) {
            this.matchesTable.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500 italic">Tidak ada match</td></tr>';
        }
    }

    buildHighlightedText(text, matches, pattern) {
        if (matches.length === 0) {
            return this.escapeHtml(text) || '<span class="text-gray-500 italic">Tidak ada teks...</span>';
        }
        
        let result = '';
        let lastIndex = 0;
        
        matches.forEach(match => {
            // Text before match
            if (match.index > lastIndex) {
                result += this.escapeHtml(text.substring(lastIndex, match.index));
            }
            // Highlighted match
            result += `<span class="match-highlight">${this.escapeHtml(match.match)}</span>`;
            // Highlight groups if any
            if (match.groups.length > 0) {
                match.groups.forEach((group, idx) => {
                    if (group) {
                        result += `<span class="group-highlight" title="Group ${idx+1}">${this.escapeHtml(group)}</span>`;
                    }
                });
            }
            lastIndex = match.index + match.length;
        });
        
        // Remaining text
        if (lastIndex < text.length) {
            result += this.escapeHtml(text.substring(lastIndex));
        }
        
        return result;
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#039;');
    }

    clearResults() {
        this.matchCount.textContent = '0';
        this.groupCount.textContent = '0';
        this.execTime.textContent = '0ms';
        this.highlightOutput.innerHTML = '<span class="text-gray-500 italic">Hasil highlighting akan muncul di sini...</span>';
        this.matchesTable.innerHTML = '';
        this.lastRegex = null;
    }

    showError(message) {
        this.clearResults();
        this.highlightOutput.innerHTML = `<span class="text-red-400"><i class="fas fa-exclamation-triangle mr-2"></i>Error: ${this.escapeHtml(message)}</span>`;
    }

    setExample(type, pattern) {
        this.patternInput.value = pattern;
        this.testRegex();
        this.updateUrl();
    }

    loadSampleText() {
        const samples = [
            `Contact us at support@example.com or sales@company.co.id. 
Our website: https://www.example.com, also check https://api.example.com/v1/users.
Call us: +62-21-1234567 or +6281234567890.
Invalid: user@.com, test@site, 123-456-7890`,
            `Log entries:
[2024-01-15 10:30:45] INFO User logged in (id: 42)
[2024-01-15 10:31:22] WARN High memory usage: 85%
[2024-01-15 10:32:01] ERROR Database connection failed
[2024-01-15 10:33:15] DEBUG Query: SELECT * FROM users WHERE id=?`,
            `Colors: #FF5733, #00FF00, #0000FF, #F0F0F0, #abc (short)
Hex values: 0xFF, 0x1A, 0x00, 0xDEADBEEF
IP addresses: 192.168.1.1, 10.0.0.1, 172.16.0.255`
        ];
        this.testStringInput.value = samples[Math.floor(Math.random() * samples.length)];
        this.charCount.textContent = this.testStringInput.value.length;
        if (this.lastRegex) this.testRegex();
    }

    clearAll() {
        this.patternInput.value = '';
        this.testStringInput.value = '';
        this.charCount.textContent = '0';
        this.clearResults();
        this.currentFlags.clear();
        document.querySelectorAll('.flag-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('flag-g').classList.add('active');
        this.currentFlags.add('g');
        this.updateUrl();
    }

    updateUrl() {
        const pattern = encodeURIComponent(this.patternInput.value);
        const flags = this.getFlagsString();
        const text = encodeURIComponent(this.testStringInput.value);
        const url = new URL(window.location);
        if (pattern) {
            url.searchParams.set('r', pattern);
            url.searchParams.set('f', flags);
        } else {
            url.searchParams.delete('r');
            url.searchParams.delete('f');
        }
        if (text && text !== '%0A') {
            url.searchParams.set('t', text);
        } else {
            url.searchParams.delete('t');
        }
        window.history.replaceState({}, '', url);
    }

    loadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const pattern = params.get('r');
        const flags = params.get('f');
        const text = params.get('t');
        
        if (pattern) {
            this.patternInput.value = decodeURIComponent(pattern);
            if (flags) {
                this.currentFlags.clear();
                document.querySelectorAll('.flag-btn').forEach(btn => btn.classList.remove('active'));
                for (const flag of flags) {
                    if (flag.match(/[gimsuy]/)) {
                        this.currentFlags.add(flag);
                        document.getElementById(`flag-${flag}`).classList.add('active');
                    }
                }
            }
        }
        if (text) {
            this.testStringInput.value = decodeURIComponent(text);
            this.charCount.textContent = this.testStringInput.value.length;
        }
        
        if (pattern) {
            this.testRegex();
        }
    }

    shareRegex() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('URL berhasil disalin ke clipboard!');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RegexPlayground();
});
