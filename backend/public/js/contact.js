document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const message = document.getElementById('message').value.trim();

            // Basic validation
            if (!name || !email || !message) {
                errorMessage.textContent = 'Please fill out all required fields.';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                errorMessage.textContent = 'Please enter a valid email address.';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
                return;
            }

            loadingMessage.style.display = 'block'; // Show loading message

            try {
                const response = await fetch('/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, message }),
                });

                const result = await response.json();
                loadingMessage.style.display = 'none'; // Hide loading message

                if (response.ok && result.success) {
                    successMessage.style.display = 'block';
                    errorMessage.style.display = 'none';
                    contactForm.reset(); // Clear the form after successful submission
                } else {
                    throw new Error(result.message || 'Submission failed.');
                }
            } catch (error) {
                loadingMessage.style.display = 'none'; // Hide loading message
                console.error('Error sending message:', error);
                errorMessage.textContent = 'There was an error submitting the form. Please try again later.';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        });
    } else {
        console.error('Error: contactForm element not found.');
    }
});
