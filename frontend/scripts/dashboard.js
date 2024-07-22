document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/bookings/user/1') // Example user ID
        .then(response => response.json())
        .then(data => {
            const bookingsDiv = document.getElementById('bookings');
            data.forEach(booking => {
                const bookingElement = document.createElement('div');
                bookingElement.innerText = `Booking ID: ${booking.id}, Service ID: ${booking.serviceId}, Date: ${new Date(booking.date).toLocaleString()}`;
                bookingsDiv.appendChild(bookingElement);
            });
        });
});
 
