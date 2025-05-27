document.getElementById('patientForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Evita que el formulario recargue la página

    const formData = new FormData(e.target);
    const data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    try {
        const response = await fetch('https://hl7-fhir-ehr-brayan12345.onrender.com/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        const messageBox = document.getElementById('responseMessage');
        if (response.ok) {
            messageBox.textContent = 'Paciente registrado exitosamente.';
            messageBox.className = 'success';
        } else {
            messageBox.textContent = `Error: ${result.detail || 'No se pudo registrar el paciente.'}`;
            messageBox.className = 'error';
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        const messageBox = document.getElementById('responseMessage');
        messageBox.textContent = 'Error de red o del servidor.';
        messageBox.className = 'error';
    }
});
