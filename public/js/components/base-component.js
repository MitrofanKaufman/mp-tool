// Базовый класс для всех компонентов
export class BaseComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    showError(message) {
        console.error('Component error:', message);
        this.dispatchEvent(new CustomEvent('component-error', {
            detail: { message },
            bubbles: true
        }));
    }

    showSuccess(message) {
        console.log('Component success:', message);
        this.dispatchEvent(new CustomEvent('component-success', {
            detail: { message },
            bubbles: true
        }));
    }

    // Метод для рендеринга, должен быть переопределен в дочерних классах
    render() {
        throw new Error('Метод render должен быть реализован в дочернем классе');
    }
}