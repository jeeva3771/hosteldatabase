<script>
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const dob = document.getElementById('dob');
const emailId = document.getElementById('emailId');
const password = document.getElementById('password');
const conform = document.getElementById('conform');
var wardenId = document.getElementById('wardenId').value;
const submit = document.getElementById('submit');

function authentication() {
    const isAdmin = document.querySelector('input[name="isAdmin"]:checked');
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "firstName": firstName.value,
        "lastName": lastName.value,
        "dob": dob.value,
        "superAdmin": parseInt(isAdmin.value),
        "emailId": emailId.value,
        "password": password.value
    });

    var requestOptions = {
        method: wardenId ? 'PUT' : 'POST',
        headers: myHeaders,
        body: raw
    };

    let url = "http://localhost:1005/api/warden";
    if (wardenId) {
        url = url + '/' + wardenId
    }

    fetch(url, requestOptions)
        .then(async (response) => {
            if (response.status === 201 || 200) {
                window.location = '/warden'
            } else {
                const responseText = await response.json();
                if (Array.isArray(responseText)) {
                    alert(responseText[0]);
                } else {
                    alert(responseText);
                }
            }
        })
        .catch(error => console.error('error', error));
}

if (wardenId) {
    getWarden(wardenId)
}

function getWarden(wardenId) {
    const requestOptions = {
        method: "GET"
    };

    fetch("http://localhost:1005/api/warden/" + wardenId, requestOptions)
        .then((response) => response.json())
        .then((warden) => {
            firstName.value = warden.firstName;
            lastName.value = warden.lastName;
            dob.value = warden.dob.split('T')[0];
            emailId.value = warden.emailId;

            if (warden.superAdmin) {
                document.getElementById('isAdmin').checked = true;
            } else {
                document.getElementById('notAdmin').checked = true;
            }

            password.value = warden.password;
            conform.value = warden.password;
        })
        .catch((error) => console.error(error));
}

function toggleSubmitButton() {
    const isAdmin = document.querySelector('input[name="isAdmin"]:checked');
    submit.disabled = !(
        firstName.value.length > 0 &&
        lastName.value.length > 0 &&
        dob.value.length > 0 &&
        emailId.value.length > 0 &&
        isAdmin !== null &&
        password.value.length > 0 &&
        conform.value.length > 0 &&
        password.value === conform.value
    );
}

firstName.addEventListener('input', toggleSubmitButton);
lastName.addEventListener('input', toggleSubmitButton);
dob.addEventListener('input', toggleSubmitButton);
emailId.addEventListener('input', toggleSubmitButton);
document.querySelectorAll('input[name="isAdmin"]').forEach(radio => radio.addEventListener('change', toggleSubmitButton));
password.addEventListener('input', toggleSubmitButton);
conform.addEventListener('input', toggleSubmitButton);
</script>