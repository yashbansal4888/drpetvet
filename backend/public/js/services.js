document.addEventListener('DOMContentLoaded', async () => {
    const servicesList = document.querySelector('.service-list');

    try {
        const response = await fetch('/api/services');
        const services = await response.json();

        services.forEach(service => {
            const serviceItem = document.createElement('li');
            serviceItem.classList.add('service-item');
            serviceItem.innerHTML = `<strong>${service.name}:</strong><p>${service.description}</p>`;
            servicesList.appendChild(serviceItem);
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
});
