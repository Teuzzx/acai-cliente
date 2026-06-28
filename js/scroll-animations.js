/**
 * Scroll Animations Manager
 * Sistema profissional de animações ao rolar a página
 */

class ScrollAnimationsManager {
    constructor() {
        this.options = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        this.observer = null;
        this.init();
    }

    init() {
        // Criar Intersection Observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    // Desanimar após a animação completar para permitir re-animações
                    setTimeout(() => {
                        // Opcional: manter a classe ou remover para re-animar
                    }, 800);
                }
            });
        }, this.options);

        // Aplicar observer em todos os elementos com classe scroll-animate
        this.observeElements();
        
        // Inicializar parallax se disponível
        this.initParallax();
    }

    observeElements() {
        const elements = document.querySelectorAll(
            '.scroll-animate, .section-animate, .card-scroll, ' +
            '.list-item-animate, .text-animate, .image-animate, ' +
            '.button-animate, .counter-animate, .line-animate'
        );

        elements.forEach((element, index) => {
            // Adicionar delay baseado no índice para staggered effect
            if (!element.classList.contains('delay-1') &&
                !element.classList.contains('delay-2') &&
                !element.classList.contains('delay-3') &&
                !element.classList.contains('delay-4') &&
                !element.classList.contains('delay-5')) {
                // Adicionar delay automático cada 5 elementos
                const delay = (index % 5) * 0.1;
                if (delay > 0) {
                    element.style.animationDelay = delay + 's';
                }
            }

            this.observer.observe(element);
        });
    }

    animateElement(element) {
        // Adicionar classe para indicar que está visível
        element.classList.add('in-view');

        // Se for section-animate, adicionar para todos os filhos também
        if (element.classList.contains('section-animate')) {
            const children = element.querySelectorAll('[class*="animate"]');
            children.forEach((child, index) => {
                setTimeout(() => {
                    child.classList.add('in-view');
                }, index * 100);
            });
        }
    }

    initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-bg');
        
        if (parallaxElements.length === 0) return;

        window.addEventListener('scroll', () => {
            parallaxElements.forEach(element => {
                const scrollPosition = window.pageYOffset;
                const elementOffset = element.offsetTop;
                const distance = scrollPosition - elementOffset;
                
                element.style.backgroundPosition = `center ${distance * 0.5}px`;
            });
        });
    }

    // Adicionar elementos dinamicamente
    addElement(element) {
        if (!element.classList.contains('scroll-animate')) {
            element.classList.add('scroll-animate');
        }
        this.observer.observe(element);
    }

    // Aplicar animação manual
    animateManually(selector, animationName, duration = 0.8) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            element.style.animation = `${animationName} ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
        });
    }

    // Remover animações
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimations = new ScrollAnimationsManager();
});

// Re-inicializar se o DOM mudar (para elementos adicionados dinamicamente)
const mutationObserver = new MutationObserver(() => {
    if (window.scrollAnimations) {
        const newElements = document.querySelectorAll(
            '.scroll-animate:not([data-scroll-observed]), ' +
            '.section-animate:not([data-scroll-observed])'
        );
        
        newElements.forEach(element => {
            element.setAttribute('data-scroll-observed', 'true');
            window.scrollAnimations.addElement(element);
        });
    }
});

// Observar mudanças no DOM
document.addEventListener('DOMContentLoaded', () => {
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Cleanup ao descarregar
window.addEventListener('beforeunload', () => {
    if (window.scrollAnimations) {
        window.scrollAnimations.destroy();
    }
    mutationObserver.disconnect();
});
