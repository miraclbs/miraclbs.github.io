/**
 * ==========================================
 *  PORTFOLIO — INTERACTION ENGINE
 *  Modüler, 60 FPS optimizeli vanilla JS
 * ==========================================
 */

(function () {
    'use strict';

    /* ------------------------------------------
       UTILITY: Throttle & RAF
       ------------------------------------------ */
    function throttle(fn, ms) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= ms) { last = now; fn.apply(this, args); }
        };
    }

    /* ------------------------------------------
       1. CUSTOM CURSOR
       ------------------------------------------ */
    function initCustomCursor() {
        const cursor = document.getElementById('cursor');
        const follower = document.getElementById('cursor-follower');
        if (!cursor || !follower) return;

        // Check for touch device
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

        let mx = 0, my = 0, fx = 0, fy = 0;

        document.addEventListener('mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
            cursor.style.left = mx + 'px';
            cursor.style.top = my + 'px';
        });

        // Smooth follower with RAF
        function animateFollower() {
            fx += (mx - fx) * 0.12;
            fy += (my - fy) * 0.12;
            follower.style.left = fx + 'px';
            follower.style.top = fy + 'px';
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        // Hover states for project cards (show custom text or "GÖR")
        const cursorText = document.getElementById('cursor-text');
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mouseenter', () => {
                const customText = card.getAttribute('data-cursor-text');
                if (cursorText) cursorText.textContent = customText || 'GÖR';
                document.body.classList.add('cursor-hover');
            });
            card.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
                if (cursorText) cursorText.textContent = 'GÖR';
            });
        });

        // Hover states for links and buttons
        document.querySelectorAll('a, button, .filter-btn').forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (!document.body.classList.contains('cursor-hover')) {
                    document.body.classList.add('cursor-link');
                }
            });
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-link'));
        });
    }

    /* ------------------------------------------
       2. SCROLL REVEAL ANIMATIONS
       ------------------------------------------ */
    function initScrollReveal() {
        const reveals = document.querySelectorAll('[data-reveal]');
        if (!reveals.length) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

        reveals.forEach((el, i) => {
            el.style.transitionDelay = (i % 4) * 0.1 + 's';
            io.observe(el);
        });
    }

    /* ------------------------------------------
       3. 3D TILT EFFECT
       ------------------------------------------ */
    function initTiltEffect() {
        const cards = document.querySelectorAll('[data-tilt]');
        if (!cards.length) return;

        // Skip on touch devices
        if ('ontouchstart' in window) return;

        cards.forEach(card => {
            let rafId = null;

            card.addEventListener('mouseenter', () => {
                card.style.transition = 'none';
            });

            card.addEventListener('mousemove', (e) => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -2;
                    const rotateY = ((x - centerX) / centerX) * 2;

                    card.style.transform =
                        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

                    // Radial glow follow
                    const px = ((x / rect.width) * 100).toFixed(1);
                    const py = ((y / rect.height) * 100).toFixed(1);
                    card.style.setProperty('--mouse-x', px + '%');
                    card.style.setProperty('--mouse-y', py + '%');
                });
            });

            card.addEventListener('mouseleave', () => {
                if (rafId) cancelAnimationFrame(rafId);
                card.style.transition = 'transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease';
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
            });
        });

        // Also apply glow tracking to bento cards
        document.querySelectorAll('.bento-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', ((x / rect.width) * 100) + '%');
                card.style.setProperty('--mouse-y', ((y / rect.height) * 100) + '%');
            });
        });
    }

    /* ------------------------------------------
       4. PROJECT FILTERS
       ------------------------------------------ */
    function initProjectFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        if (!filterBtns.length || !projectCards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    const categories = card.getAttribute('data-category') || '';
                    const match = filter === 'all' || categories.includes(filter);

                    if (match) {
                        card.classList.remove('filter-hide');
                        card.classList.add('filter-show');
                        card.style.position = '';
                        card.style.visibility = '';
                        card.style.transform = '';
                        // Remove filter-show after animation so tilt works
                        card.addEventListener('animationend', function handler() {
                            card.classList.remove('filter-show');
                            card.style.opacity = '1';
                            card.removeEventListener('animationend', handler);
                        });
                    } else {
                        card.classList.remove('filter-show');
                        card.classList.add('filter-hide');
                    }
                });
            });
        });
    }

    /* ------------------------------------------
       4b. PROJECT CARD CLICK
       ------------------------------------------ */
    function initProjectCardLinks() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking the detail button or external link
                if (e.target.closest('.project-detail-btn') || e.target.closest('.project-external')) return;
                const link = card.querySelector('.project-external');
                if (link) window.open(link.href, '_blank');
            });
        });
    }

    /* ------------------------------------------
       5. PROJECT MODAL
       ------------------------------------------ */
    const projectData = {
        portfolio: {
            badge: 'Frontend',
            title: 'Kişisel Portfolio Web Sitesi',
            desc: 'Modern teknolojiler ve tasarım trendleri ile oluşturulmuş kişisel portfolyo sitesi. Dark-theme odaklı, yüksek etkileşimli ve performans optimizeli. Glassmorphism, Bento Grid, Custom Cursor ve 3D Tilt efektleri.',
            challenge: 'Herhangi bir framework kullanmadan, saf HTML/CSS/JS ile premium seviyede bir deneyim oluşturmak. 60 FPS animasyonlar ve erişilebilirlik standartlarını aynı anda sağlamak.',
            solution: 'CSS Custom Properties ile modüler tasarım sistemi kuruldu. IntersectionObserver API ile performanslı scroll animasyonları, requestAnimationFrame ile akıcı cursor ve tilt efektleri geliştirildi. AI destekli kodlama süreçleriyle hızlı iterasyon sağlandı.',
            tech: ['HTML5', 'CSS3', 'Vanilla JavaScript', 'IntersectionObserver', 'CSS Grid', 'AI Destekli Geliştirme'],
            link: 'https://miraclbs.github.io'
        },
        stockanalyze: {
            badge: 'Full-Stack / AI',
            title: 'Stock Analyze — AI Destekli Finansal Analiz',
            desc: 'Borsada yatırım yaparken şirketlerin gerçek değerini (içsel değer) hesaplamak ve finansal verileri doğru yorumlamak hepimiz için zaman zaman karmaşık olabiliyor. Bu süreci hem kendim hem de diğer yatırımcılar için çok daha şeffaf ve anlaşılır kılmak adına yapay zeka destekli bir finansal analiz uygulaması geliştirdim.',
            challenge: 'BIST100 ve S&P500 gibi farklı piyasaların verilerini tek bir platformda birleştirmek, Benjamin Graham\'ın değer yatırımı felsefesine uygun güvenlik marjı hesaplamalarını doğru şekilde uygulamak ve yapay zeka analizlerini anlamlı sonuçlara dönüştürmek.',
            solution: 'React + TypeScript ile modern, tip-güvenli bir arayüz oluşturuldu. Supabase ile güvenilir veri yönetimi sağlandı. OpenAI API entegrasyonu ile hisse senetlerinin temel analizleri saniyeler içinde yapılabiliyor. Güvenlik Marjı (Margin of Safety) hesaplaması ile risksiz alım aralıkları kolayca görülebiliyor.',
            tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'OpenAI API'],
            link: 'https://stock-analyze-dotcom.vercel.app/'
        },
        cardgame: {
            badge: 'AI / Frontend',
            title: 'Card Game — AI Destekli Hikaye Oyunu',
            desc: 'Sabit senaryoların aksine, oyuncunun seçimleriyle ve kendi yazdığı metinlerle gidişatını belirlediği, her oynayışta tamamen eşsiz bir deneyim sunan yapay zeka destekli interaktif bir hikaye/kart oyunu.',
            challenge: 'Farklı evrenler (bilim kurgu, fantastik dünya) için dinamik hikaye üretimi, serbest metin girişi ile hikaye yönlendirme, 3D kart animasyonları ve sahneye özel ses/müzik geçişleriyle sürükleyici bir atmosfer oluşturmak.',
            solution: 'OpenAI API ile dinamik hikaye ve prompt yönetimi kurgulandı. React + Vite ile hızlı ve akıcı bir arayüz oluşturuldu. Firebase ile kullanıcı verisi yönetimi sağlandı. 3D Tilt efektleri ve özel CSS animasyonlarıyla sinematik bir oyun deneyimi sunuldu. Hesap gerektirmeden doğrudan oynama imkanı eklendi.',
            tech: ['React', 'Vite', 'CSS Animations', 'OpenAI API', 'Firebase', 'Prompt Engineering'],
            link: 'https://cardgame-sigma.vercel.app/'
        }
    };

    function initProjectModal() {
        const modal = document.getElementById('project-modal');
        const modalContent = document.getElementById('modal-content');
        const closeBtn = document.getElementById('modal-close');
        if (!modal || !modalContent) return;

        // Open modal
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = btn.getAttribute('data-modal');
                const data = projectData[key];
                if (!data) return;

                modalContent.innerHTML = buildModalHTML(data);
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // Close handlers
        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });
    }

    function buildModalHTML(data) {
        let html = `
            <span class="modal-badge">${data.badge}</span>
            <h2 class="modal-title">${data.title}</h2>
            <p class="modal-desc">${data.desc}</p>
            <div class="modal-section">
                <h3 class="modal-section-title">Zorluk (Challenge)</h3>
                <p>${data.challenge}</p>
            </div>
            <div class="modal-section">
                <h3 class="modal-section-title">Çözüm (Solution)</h3>
                <p>${data.solution}</p>
            </div>
            <div class="modal-section">
                <h3 class="modal-section-title">Kullanılan Teknolojiler</h3>
                <div class="modal-tech-list">
                    ${data.tech.map(t => `<span class="modal-tech-tag">${t}</span>`).join('')}
                </div>
            </div>`;

        if (data.link) {
            html += `
            <a href="${data.link}" target="_blank" rel="noopener noreferrer" class="modal-link">
                <i class="fas fa-external-link-alt"></i>
                Projeyi Görüntüle
            </a>`;
        }
        return html;
    }

    /* ------------------------------------------
       6. NAVIGATION
       ------------------------------------------ */
    function initNavigation() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link');

        // Hamburger toggle
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu on link click
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 72,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Navbar scroll effect
        if (navbar) {
            window.addEventListener('scroll', throttle(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 60);
            }, 100));
        }

        // Active link tracking
        const sections = document.querySelectorAll('section[id]');
        const linkObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                    if (active) active.classList.add('active');
                }
            });
        }, { threshold: 0.3, rootMargin: '-72px 0px -50% 0px' });

        sections.forEach(s => linkObserver.observe(s));

        // ESC closes mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    /* ------------------------------------------
       7. TERMINAL ANIMATION
       ------------------------------------------ */
    function initTerminalAnimation() {
        const commandEl = document.getElementById('terminal-text');
        const outputEl = document.getElementById('terminal-output');
        if (!commandEl || !outputEl) return;

        const commands = [
            {
                cmd: 'cat developer.json',
                output: [
                    '{ <span class="output-key">"ad"</span>: <span class="output-string">"Atıf Miraç İlbaş"</span>,',
                    '  <span class="output-key">"rol"</span>: <span class="output-string">"Yazılım Mühendisi"</span>,',
                    '  <span class="output-key">"konum"</span>: <span class="output-string">"Ankara, TR"</span>,',
                    '  <span class="output-key">"stack"</span>: [<span class="output-string">"React"</span>, <span class="output-string">"Next.js"</span>, <span class="output-string">".NET"</span>],',
                    '  <span class="output-key">"ai"</span>: <span class="output-string">"Prompt Engineering ✓"</span> }'
                ]
            },
            {
                cmd: 'git log --oneline -3',
                output: [
                    '<span class="output-value">a1b2c3d</span> feat: portfolio redesign ✨',
                    '<span class="output-value">e4f5g6h</span> feat: AI-powered dev workflow',
                    '<span class="output-value">i7j8k9l</span> refactor: Next.js architecture'
                ]
            },
            {
                cmd: 'npx next build',
                output: [
                    '<span class="output-value">✓</span> Compiled in <span class="output-string">1.8s</span>',
                    '<span class="output-value">✓</span> Linting and type checking',
                    '<span class="output-value">✓</span> Collecting build traces',
                    '<span class="output-value">✓</span> Deploy ready 🚀'
                ]
            }
        ];

        let cmdIndex = 0;

        function typeCommand(text, callback) {
            let i = 0;
            commandEl.textContent = '';
            function type() {
                if (i < text.length) {
                    commandEl.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, 60 + Math.random() * 40);
                } else {
                    setTimeout(callback, 400);
                }
            }
            type();
        }

        function showOutput(lines, callback) {
            outputEl.innerHTML = '';
            let i = 0;
            function addLine() {
                if (i < lines.length) {
                    const div = document.createElement('div');
                    div.className = 'output-line';
                    div.innerHTML = lines[i];
                    outputEl.appendChild(div);
                    i++;
                    setTimeout(addLine, 120);
                } else {
                    setTimeout(callback, 2500);
                }
            }
            addLine();
        }

        function runCycle() {
            const current = commands[cmdIndex % commands.length];
            typeCommand(current.cmd, () => {
                showOutput(current.output, () => {
                    cmdIndex++;
                    runCycle();
                });
            });
        }

        // Start after a short delay
        setTimeout(runCycle, 800);
    }

    /* ------------------------------------------
       8. FOOTER YEAR
       ------------------------------------------ */
    function initFooterYear() {
        const yearEl = document.getElementById('footer-year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    /* ------------------------------------------
       9. THEME TOGGLE
       ------------------------------------------ */
    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        const icon = document.getElementById('theme-icon');
        if (!toggle || !icon) return;

        // Set correct icon for current theme
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }

        toggle.addEventListener('click', () => {
            const html = document.documentElement;
            const isLight = html.getAttribute('data-theme') === 'light';
            const newTheme = isLight ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Swap icon
            if (newTheme === 'light') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    // Apply saved theme instantly (before DOMContentLoaded) to prevent flash
    (function () {
        const saved = localStorage.getItem('theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        }
    })();

    /* ------------------------------------------
       INIT ALL
       ------------------------------------------ */
    document.addEventListener('DOMContentLoaded', () => {
        initCustomCursor();
        initScrollReveal();
        initTiltEffect();
        initProjectFilters();
        initProjectCardLinks();
        initProjectModal();
        initNavigation();
        initTerminalAnimation();
        initFooterYear();
        initThemeToggle();
        initEmailCopy();
    });

    /* ------------------------------------------
       10. EMAIL COPY
       ------------------------------------------ */
    function initEmailCopy() {
        const emailCard = document.getElementById('email-card');
        const toast = document.getElementById('copy-toast');
        if (!emailCard || !toast) return;

        emailCard.addEventListener('click', () => {
            navigator.clipboard.writeText('mrclbs97@gmail.com').then(() => {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            });
        });
    }

})();