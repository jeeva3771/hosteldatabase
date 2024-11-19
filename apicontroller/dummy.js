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

<%- include('../../partials/header.ejs', { appURL: appURL, title: 'Block form' }) %>
<%- include('../../partials/nonloginlayout.ejs', { user: user, subTitle: 'Block form' }) %>
<%- include('../../partials/breadcrumb.ejs', { breadCrumbs: breadCrumbs }) %>
<%- include('../../partials/aside.ejs') %>

<section class="section">
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title"></h5>
                            <!-- Horizontal Form -->
                    <form>
                        <div id="alertContainer">
                        </div>
                        <div class="row mb-3">
                            <label for="blockCode" class="col-sm-2 col-form-label">Block Code</label>
                            <div class="col-sm-10">
                                <input type="text" class="form-control" id="blockCode">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="blockLocation" class="col-sm-2 col-form-label">Location</label>
                            <div class="col-sm-10">
                                <input type="text" class="form-control" id="blockLocation">
                            </div>
                        </div>
                        <fieldset class="row mb-3">
                            <legend class="col-form-label col-sm-2 pt-0">Status</legend>
                            <div class="col-sm-10">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="status" id="isActive"
                                        value="1">
                                    <label class="form-check-label" for="isActive">Active</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="status" id="inActive"
                                        value="0">
                                    <label class="form-check-label" for="inActive">InActive</label>
                                </div>
                            </div>
                        </fieldset>
                        <div class="text-center">
                            <button type="reset" class="btn btn-secondary">Reset</button>
                            <button type="button" onclick="saveOrUpdateBlock()" class="btn btn-primary"
                                id="submitButton" disabled>Submit</button>
                        </div>
                    </form><!-- End Horizontal Form -->
                </div>
            </div>
        </div>
    </div>
</section>
</main>
<%- include('../../partials/footer.ejs') %>

<script>
    var blockCodeDom = document.getElementById('blockCode');
    var blockLocationDom = document.getElementById('blockLocation');
    var selectedStatusDom = document.querySelectorAll('input[name="status"]')
    var submitButtonDom = document.getElementById('submitButton');
    var blockId = <%= blockId || 'null' %>;

    function getSelectedStatus() {
        let selectedStatusValue = null;

        selectedStatusDom.forEach(radio => {
            if (radio.checked) {
                selectedStatusValue = parseInt(radio.value);
            }
        });
        return selectedStatusValue;
    }

    function saveOrUpdateBlock() {
        const selectedStatusValue = getSelectedStatus();

        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({
            "blockCode": blockCodeDom.value,
            "blockLocation": blockLocationDom.value,
            "isActive": selectedStatusValue
        });

        var requestOptions = {
            method: blockId ? 'PUT' : 'POST',
            headers: myHeaders,
            body: raw
        };

        let url = getAppUrl(`api/block${blockId ? `/${blockId}` : ''}`);
        
        fetch(url, requestOptions)
            .then(async (response) => {
                // if (response.status === 201 || 200) {
                        //     window.location = getAppUrl('block');
                        // } else {
                        //     alert(await response.text())
                        // }        
                const alertContainer = document.getElementById("alertContainer"); // Ensure this exists in your HTML
                alertContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show w-25 mx-auto fs-6" role="alert">
                    success
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;

                setTimeout(() => {
                window.location = getAppUrl('block');
                }, 1000);
            })
                .catch(error => console.error('error', error));
    }

    if (blockId) {
        getBlock(blockId)
    }

    function getBlock(blockId) {
        const requestOptions = {
            method: "GET"
        };

        fetch(`${appURL}api/block/` + blockId, requestOptions)
            .then(async (response) => {
                const block = await response.json()
                blockCodeDom.value = block.blockCode
                blockLocationDom.value = block.blockLocation
            
                if (block.isActive) {
                document.getElementById('isActive').checked = true;
                } else {
                document.getElementById('inActive').checked = true;
                }
            })
            .catch((error) => console.error(error));
    }

    function toggleSubmitButton() {
        const selectedStatusValue = getSelectedStatus();
            submitButton.disabled = !(
            blockCodeDom.value.length > 0 &&
            blockLocationDom.value.length > 0 &&
            selectedStatusValue !== null)
    }

    blockCodeDom.addEventListener('input', toggleSubmitButton);
    blockLocationDom.addEventListener('input', toggleSubmitButton);
    document.querySelectorAll('input[name="status"]').forEach(radio => radio.addEventListener('change', toggleSubmitButton));
</script>
