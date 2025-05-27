document.addEventListener('DOMContentLoaded', function () {
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');

    const data = {
        COL: {
            name: "Colombia",
            states: {
                "Cundinamarca": ["Bogotá", "Soacha", "Chía"],
                "Antioquia": ["Medellín", "Envigado"],
                "Valle del Cauca": ["Cali", "Palmira"]
            }
        }
    };

    function populateCountries() {
        countrySelect.innerHTML = '<option value="">-- País --</option>';
        for (const code in data) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = data[code].name;
            countrySelect.appendChild(option);
        }
    }

    function populateStates(countryCode) {
        stateSelect.innerHTML = '<option value="">-- Departamento --</option>';
        citySelect.innerHTML = '<option value="">-- Ciudad --</option>';
        citySelect.disabled = true;

        if (!countryCode || !data[countryCode]) {
            stateSelect.disabled = true;
            return;
        }

        const states = Object.keys(data[countryCode].states);
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
        stateSelect.disabled = false;
    }

    function populateCities(countryCode, stateName) {
        citySelect.innerHTML = '<option value="">-- Ciudad --</option>';

        if (!countryCode || !stateName || !data[countryCode]?.states[stateName]) {
            citySelect.disabled = true;
            return;
        }

        data[countryCode].states[stateName].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
        citySelect.disabled = false;
    }

    countrySelect.addEventListener('change', () => {
        populateStates(countrySelect.value);
    });

    stateSelect.addEventListener('change', () => {
        populateCities(countrySelect.value, stateSelect.value);
    });

    populateCountries();

    document.getElementById('patientForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const patientFHIR = {
            resourceType: "Patient",
            identifier: [{
                use: "official",
                type: {
                    coding: [{
                        system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                        code: "ID"
                    }],
                    text: "Cédula de Ciudadanía"
                },
                value: formData.get("identifier")
            }],
            name: [{
                use: "official",
                family: formData.get("lastName"),
                given: [formData.get("firstName")]
            }],
            telecom: [
                {
                    system: "phone",
                    value: formData.get("phone"),
                    use: "mobile"
                },
                {
                    system: "email",
                    value: formData.get("email"),
                    use: "home"
                }
            ],
            gender: formData.get("gender"),
            birthDate: formData.get("birthDate"),
            address: [{
                use: "home",
                line: [formData.get("address")],
                city: formData.get("city"),
                state: formData.get("state"),
                postalCode: formData.get("postalCode"),
                country: formData.get("country")
            }]
        };

        try {
            const response = await fetch('https://hl7-fhir-ehr-brayan-123456.onrender.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientFHIR)
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
});
