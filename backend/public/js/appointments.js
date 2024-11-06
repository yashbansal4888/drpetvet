document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const location = document.getElementById('location').value; // New field
            const doctor = document.getElementById('doctor').value;     // New field
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;

            try {
                const response = await fetch('/book-appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, phone, location, doctor, date, time }),
                });

                const result = await response.json();
                if (result.success) {
                    alert('Your appointment has been successfully booked. A confirmation email has been sent.');
                    appointmentForm.reset(); // Reset the form on success
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error booking appointment:', error);
                alert('Failed to book appointment. Please try again.');
            }
        });
    }
});
