<%- include('../../partials/header.ejs', { appURL: appURL, title: 'Warden form' }) %>
<%- include('../../partials/nonloginlayout.ejs', { user: user, subTitle: 'Warden form' }) %>
<%- include('../../partials/breadcrumb.ejs', { breadCrumbs: breadCrumbs }) %>
<%- include('../../partials/aside.ejs') %>

<section class="section">
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">

                    <!-- Horizontal Form -->
                    <form class="mt-4">
                        <div class="row mb-3">
                            <label for="firstName" class="col-sm-2 col-form-label">First Name</label>
                            <div class="col-sm-10">
                                <input type="text" class="form-control" id="firstName" 
                                    onkeyup="toggleSubmitButton()">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="lastName" class="col-sm-2 col-form-label">Last Name</label>
                            <div class="col-sm-10">
                                <input type="text" class="form-control" id="lastName">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="dob" class="col-sm-2 col-form-label">DOB</label>
                            <div class="col-sm-10">
                              <input type="date" class="form-control" id="dob">
                            </div>
                        </div>
                        <fieldset class="row mb-3">
                            <legend class="col-form-label col-sm-2 pt-0">Admin</legend>
                            <div class="col-sm-10">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="isAdmin"
                                        id="isAdmin" value="1">
                                    <label class="form-check-label" for="isAdmin">
                                        Yes
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="isAdmin"
                                        id="notAdmin" value="0">
                                    <label class="form-check-label" for="notAdmin">
                                        No
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                        <div class="row mb-3">
                            <label for="emailId" class="col-sm-2 col-form-label">Email Id</label>
                            <div class="col-sm-10">
                              <input type="email" class="form-control" id="emailId">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="password" class="col-sm-2 col-form-label">Password</label>
                            <div class="col-sm-10">
                              <input type="password" class="form-control" id="password">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="conform" class="col-sm-2 col-form-label">Confirm Password</label>
                            <div class="col-sm-10">
                              <input type="password" class="form-control" id="conform">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <label for="inputNumber" class="col-sm-2 col-form-label">Image Upload</label>
                            <div class="col-sm-10">
                              <input class="form-control" type="file" id="imageUpload" name="image">
                            </div>
                        </div>
                        <div class="text-center">
                            <button type="reset" class="btn btn-secondary">Reset</button>
                            <button type="button" onclick="authentication()" class="btn btn-primary"
                                id="submitButton" >Submit</button>
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
    const firstNameDom = document.getElementById('firstName');
    const lastNameDom = document.getElementById('lastName');
    const dobDom = document.getElementById('dob');
    var isAdminDom = document.getElementById('isAdmin');
    var notAdminDom = document.getElementById('notAdmin');
    const emailIdDom = document.getElementById('emailId');
    const passwordDom = document.getElementById('password');
    const conformDom = document.getElementById('conform');
    const imageUploadDom = document.getElementById('imageUpload');
    var wardenId = <%= wardenId || 'null' %>;
    const submitDom = document.getElementById('submitButton');

    function authentication() {
        const adminStatusValue = getSelectedRadioValue('isAdmin');
        var myHeaders = new Headers();
        var formData = new FormData();

        if (imageUploadDom.files.length > 0) {
            formData.append("image", imageUploadDom.files[0]);
        }       

        formData.append("firstName", firstNameDom.value);
        formData.append("lastName", lastNameDom.value);
        formData.append("dob", dobDom.value);
        formData.append("emailId", emailIdDom.value);
        formData.append("password", passwordDom.value);
        formData.append("superAdmin", adminStatusValue);

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formData,
            redirect: 'follow'
        };

        fetch("http://localhost:1005/api/warden", requestOptions)
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
                        firstNameDom.value = warden.firstName;
                        lastNameDom.value = warden.lastName;
                        dobDom.value = warden.dob.split('T')[0];
                        emailIdDom.value = warden.emailId;

                        if (warden.superAdmin) {
                            isAdminDom.checked = true;
                        } else {
                            notAdminDom.checked = true;
                        }

                        passwordDom.value = warden.password;
                        conformDom.value = warden.password;
                    })
                    .catch((error) => console.error(error));
            }

            function toggleSubmitButton() {
                const adminOrNot = getSelectedRadioValue('isAdmin');
                submitDom.disabled = !(
                    firstNameDom.value.length > 0 &&
                    lastNameDom.value.length > 0 &&
                    dobDom.value.length > 0 &&
                    emailIdDom.value.length > 0 &&
                    adminOrNot !== null &&
                    passwordDom.value.length > 0 &&
                    conformDom.value.length > 0 &&
                    passwordDom.value === conformDom.value
                );
            }

            firstNameDom.addEventListener('input', toggleSubmitButton);
            lastNameDom.addEventListener('input', toggleSubmitButton);
            dobDom.addEventListener('input', toggleSubmitButton);
            emailIdDom.addEventListener('input', toggleSubmitButton);
            document.querySelectorAll('input[name="isAdmin"]').forEach(radio => radio.addEventListener('change', toggleSubmitButton));
            passwordDom.addEventListener('input', toggleSubmitButton);
            conformDom.addEventListener('input', toggleSubmitButton);
</script>
