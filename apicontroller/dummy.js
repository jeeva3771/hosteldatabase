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


<%- include('../../partials/header.ejs', { appURL: appURL, title: 'Profile' }) %>
  <%- include('../../partials/nonloginlayout.ejs', { user: user, subTitle: 'Profile' }) %>
    <%- include('../../partials/breadcrumb.ejs', { breadCrumbs: breadCrumbs }) %>
      <%- include('../../partials/aside.ejs') %>

        <section class="section profile">
          <div class="row">
            <div class="col-xl-4">

              <div class="card">
                <div class="card-body profile-card pt-4 d-flex flex-column align-items-center">

                  <img src="" alt="Profile" class="rounded-circle" id="profile">
                  <h2>Kevin Anderson</h2>
                  <h3>Web Designer</h3>
                  <div class="social-links mt-2">
                    <a href="#" class="twitter"><i class="bi bi-twitter"></i></a>
                    <a href="#" class="facebook"><i class="bi bi-facebook"></i></a>
                    <a href="#" class="instagram"><i class="bi bi-instagram"></i></a>
                    <a href="#" class="linkedin"><i class="bi bi-linkedin"></i></a>
                  </div>
                </div>
              </div>

            </div>

            <div class="col-xl-8">

              <div class="card">
                <div class="card-body pt-3">
                  <!-- Bordered Tabs -->
                  <ul class="nav nav-tabs nav-tabs-bordered">

                    <li class="nav-item">
                      <button class="nav-link active" data-bs-toggle="tab"
                        data-bs-target="#profile-overview">Overview</button>
                    </li>

                    <li class="nav-item">
                      <button class="nav-link" data-bs-toggle="tab" data-bs-target="#profile-edit">Edit Profile</button>
                    </li>

                    <li class="nav-item">
                      <button class="nav-link" data-bs-toggle="tab" data-bs-target="#profile-settings">Settings</button>
                    </li>

                    <li class="nav-item">
                      <button class="nav-link" data-bs-toggle="tab" data-bs-target="#profile-change-password">Change
                        Password</button>
                    </li>

                  </ul>
                  <div class="tab-content pt-2">

                    <div class="tab-pane fade show active profile-overview" id="profile-overview">
                      <h5 class="card-title">About</h5>
                      <p class="small fst-italic">Sunt est soluta temporibus accusantium neque nam maiores cumque
                        temporibus. Tempora libero non est unde veniam est qui dolor. Ut sunt iure rerum quae quisquam
                        autem eveniet perspiciatis odit. Fuga sequi sed ea saepe at unde.</p>

                      <h5 class="card-title">Profile Details</h5>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label ">Full Name</div>
                        <div class="col-lg-9 col-md-8">Kevin Anderson</div>
                      </div>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label">Company</div>
                        <div class="col-lg-9 col-md-8">Lueilwitz, Wisoky and Leuschke</div>
                      </div>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label">Job</div>
                        <div class="col-lg-9 col-md-8">Web Designer</div>
                      </div>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label">Country</div>
                        <div class="col-lg-9 col-md-8">USA</div>
                      </div>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label">Address</div>
                        <div class="col-lg-9 col-md-8">A108 Adam Street, New York, NY 535022</div>
                      </div>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label">Phone</div>
                        <div class="col-lg-9 col-md-8">(436) 486-3538 x29071</div>
                      </div>

                      <div class="row">
                        <div class="col-lg-3 col-md-4 label">Email</div>
                        <div class="col-lg-9 col-md-8">k.anderson@example.com</div>
                      </div>

                    </div>

                    <div class="tab-pane fade profile-edit pt-3" id="profile-edit">

                      <!-- Profile Edit Form -->
                      <form>
                        <div class="row mb-3">
                          <label for="profileImage" class="col-md-4 col-lg-3 col-form-label">Profile Image</label>
                          <div class="col-md-8 col-lg-9">
                            <img src="" alt="Profile">
                            <div class="pt-2">
                              <a href="#" class="btn btn-primary btn-sm" title="Upload new profile image"><i
                                  class="bi bi-upload"></i></a>
                              <a href="#" class="btn btn-danger btn-sm" title="Remove my profile image"><i
                                  class="bi bi-trash"></i></a>
                            </div>
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="fullName" class="col-md-4 col-lg-3 col-form-label">Full Name</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="fullName" type="text" class="form-control" id="fullName"
                              value="Kevin Anderson">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="about" class="col-md-4 col-lg-3 col-form-label">About</label>
                          <div class="col-md-8 col-lg-9">
                            <textarea name="about" class="form-control" id="about"
                              style="height: 100px">Sunt est soluta temporibus accusantium neque nam maiores cumque temporibus. Tempora libero non est unde veniam est qui dolor. Ut sunt iure rerum quae quisquam autem eveniet perspiciatis odit. Fuga sequi sed ea saepe at unde.</textarea>
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="company" class="col-md-4 col-lg-3 col-form-label">Company</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="company" type="text" class="form-control" id="company"
                              value="Lueilwitz, Wisoky and Leuschke">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Job" class="col-md-4 col-lg-3 col-form-label">Job</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="job" type="text" class="form-control" id="Job" value="Web Designer">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Country" class="col-md-4 col-lg-3 col-form-label">Country</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="country" type="text" class="form-control" id="Country" value="USA">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Address" class="col-md-4 col-lg-3 col-form-label">Address</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="address" type="text" class="form-control" id="Address"
                              value="A108 Adam Street, New York, NY 535022">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Phone" class="col-md-4 col-lg-3 col-form-label">Phone</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="phone" type="text" class="form-control" id="Phone"
                              value="(436) 486-3538 x29071">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Email" class="col-md-4 col-lg-3 col-form-label">Email</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="email" type="email" class="form-control" id="Email"
                              value="k.anderson@example.com">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Twitter" class="col-md-4 col-lg-3 col-form-label">Twitter Profile</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="twitter" type="text" class="form-control" id="Twitter"
                              value="https://twitter.com/#">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Facebook" class="col-md-4 col-lg-3 col-form-label">Facebook Profile</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="facebook" type="text" class="form-control" id="Facebook"
                              value="https://facebook.com/#">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Instagram" class="col-md-4 col-lg-3 col-form-label">Instagram Profile</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="instagram" type="text" class="form-control" id="Instagram"
                              value="https://instagram.com/#">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="Linkedin" class="col-md-4 col-lg-3 col-form-label">Linkedin Profile</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="linkedin" type="text" class="form-control" id="Linkedin"
                              value="https://linkedin.com/#">
                          </div>
                        </div>

                        <div class="text-center">
                          <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                      </form><!-- End Profile Edit Form -->

                    </div>

                    <div class="tab-pane fade pt-3" id="profile-settings">

                      <!-- Settings Form -->
                      <form>

                        <div class="row mb-3">
                          <label for="fullName" class="col-md-4 col-lg-3 col-form-label">Email Notifications</label>
                          <div class="col-md-8 col-lg-9">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="changesMade" checked>
                              <label class="form-check-label" for="changesMade">
                                Changes made to your account
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="newProducts" checked>
                              <label class="form-check-label" for="newProducts">
                                Information on new products and services
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="proOffers">
                              <label class="form-check-label" for="proOffers">
                                Marketing and promo offers
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="securityNotify" checked disabled>
                              <label class="form-check-label" for="securityNotify">
                                Security alerts
                              </label>
                            </div>
                          </div>
                        </div>

                        <div class="text-center">
                          <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                      </form><!-- End settings Form -->

                    </div>

                    <div class="tab-pane fade pt-3" id="profile-change-password">
                      <!-- Change Password Form -->
                      <form>

                        <div class="row mb-3">
                          <label for="currentPassword" class="col-md-4 col-lg-3 col-form-label">Current Password</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="password" type="password" class="form-control" id="currentPassword">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="newPassword" class="col-md-4 col-lg-3 col-form-label">New Password</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="newpassword" type="password" class="form-control" id="newPassword">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <label for="renewPassword" class="col-md-4 col-lg-3 col-form-label">Re-enter New
                            Password</label>
                          <div class="col-md-8 col-lg-9">
                            <input name="renewpassword" type="password" class="form-control" id="renewPassword">
                          </div>
                        </div>

                        <div class="text-center">
                          <button type="submit" class="btn btn-primary">Change Password</button>
                        </div>
                      </form><!-- End Change Password Form -->

                    </div>

                  </div><!-- End Bordered Tabs -->

                </div>
              </div>

            </div>
          </div>
        </section>

        </main>
        <%- include('../../partials/footer.ejs') %>

          <script>
            var wardenId = <%= wardenId || 'null' %>;
            const profileDom = document.getElementById('profile');

            function wardenDetails() {
              const myHeaders = new Headers();

              const requestOptions = {
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow',
              };

              fetch(`http://localhost:1005/api/warden/${wardenId}/avatar`, requestOptions)
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(`Error fetching avatar: ${response.status}`);
                  }
                  return response.blob();
                })
                .then((blob) => {
                  const imageUrl = URL.createObjectURL(blob);
                  
                  if (profileDom) {
                    profileDom.src = imageUrl;
                  } else {
                    console.error('Profile DOM element not found!');
                  }
                })
                .catch((error) => {
                  console.error('Error:', error);
                });
            }

            window.addEventListener('load', () => {
              wardenDetails()
            })


          </script>


          var wardenId = <%= wardenId || 'null' %>;
  const userProfileDom = document.getElementById('userProfile');
  const profileDom = document.getElementById('profile');


  function wardenDetails() {
    const myHeaders = new Headers();

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    fetch(`http://localhost:1005/api/warden/${wardenId}/avatar`, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching avatar: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const imageUrl = URL.createObjectURL(blob);

        if (userProfileDom && profileDom) {
          userProfileDom.src = imageUrl;
          profileDom.src = imageUrl
        } else if (userProfileDom) {
          profileDom.src = imageUrl
        } else {
          console.error('Profile DOM element not found!');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  window.addEventListener('load', () => {
    wardenDetails()
  })

</script>
