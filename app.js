document.addEventListener('DOMContentLoaded', function() {
    const patientForm = document.getElementById('patientForm');
    const responseMessageDiv = document.getElementById('responseMessage');

    function showMessage(message, type) {
        responseMessageDiv.textContent = message;
        responseMessageDiv.className = '';
        responseMessageDiv.classList.add(type);
        responseMessageDiv.style.display = 'block';
    }

    patientForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        responseMessageDiv.style.display = 'none';

        const name = document.getElementById('name').value;
        const familyName = document.getElementById('familyName').value;
        const gender = document.getElementById('gender').value;
        const birthDate = document.getElementById('birthDate').value;
        const identifierSystemValue = document.getElementById('identifierSystem').value;
        const identifierValue = document.getElementById('identifierValue').value;
        const cellPhone = document.getElementById('cellPhone').value;
        const email = document.getElementById('email').value;
        const addressLine = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const postalCode = document.getElementById('postalCode').value;
        const country = document.getElementById('country').value;

        // Separar sistema y código del identificador
        const [identifierSystem, identifierCode] = identifierSystemValue.split('|');

        const patientFhirId = `patient-${Date.now()}`;

        const patientFhirResource = {
            resourceType: "Patient",
            id: patientFhirId,
            active: true,
            identifier: [{
                use: "official",
                type: {
                    coding: [{
                        system: identifierSystem,
                        code: identifierCode
                    }]
                },
                value: identifierValue
            }],
            name: [{
                use: "official",
                given: [name],
                family: familyName
            }],
            telecom: [
                {
                    system: "phone",
                    value: cellPhone,
                    use: "mobile"
                },
                {
                    system: "email",
                    value: email,
                    use: "home"
                }
            ],
            gender: gender,
            birthDate: birthDate,
            address: [{
                use: "home",
                line: [addressLine],
                city: city,
                state: state,
                postalCode: postalCode,
                country: country
            }]
        };

        console.log("Datos FHIR a enviar:", JSON.stringify(patientFhirResource, null, 2));

        try {
            const backendUrl = 'https://hl7-fhir-ehr-brayan12345.onrender.com/patients';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(patientFhirResource)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            console.log('Success:', data);
            showMessage('Paciente registrado exitosamente! ID: ' + (data.insertedId || patientFhirId), 'success');
            patientForm.reset();

        } catch (error) {
            console.error('Error al enviar datos:', error);
            showMessage('Hubo un error al registrar el paciente: ' + error.message, 'error');
        }
    });
});
