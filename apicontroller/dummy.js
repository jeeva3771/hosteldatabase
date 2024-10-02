function readAuthenticationName(req, res) {
    var sessionData = req.session.data
    return sessionData
}

module.exports = (app) => {
    app.get('/api/authentication-name', (req, res) => {
        const sessionData = readAuthenticationName(req, res);
        res.status(200).send(sessionData);
    });
}

module.exports.mysqlQuery = mysqlQuery;
module.exports.readAuthenticationName = readAuthenticationName;



--------------------------

<%- include('../../partials/header.ejs', { isMenuVisible : true, title: 'Coursepage' }) %>
    <div class="container">
        <div class="row">
            <div class="col">
                <select class="form-select" id="limit" onchange="changeLimit()">
                    <option value="5" href="#">5</option>
                    <option value="10" href="#" selected>10</option>
                    <option value="20" href="#">20</option>
                    <option value="40" href="#">40</option>
                </select>
            </div>
            <div class="col-auto">
                <a class="btn btn-info" href="/course/add">Add</a>
            </div>
            <div class="col order-1">
                <form class="form-inline">
                    <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                    <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
                </form>
            </div>
        </div>
    </div>

    <table class="table table-striped table-hover table-bordered">
        <thead>
            <tr>
                <th scope="col">Sno</th>
                <th scope="col">Course Name
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        class="bi bi-arrow-down-short" viewBox="0 0 16 16" onclick="sortByColumn('courseName', 'DESC')">
                        <path fill-rule="evenodd"
                            d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        class="bi bi-arrow-up-short" viewBox="0 0 16 16" onclick="sortByColumn('courseName', 'ASC')">
                        <path fill-rule="evenodd"
                            d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5" />
                    </svg>
                </th>
                <th scope="col">Created By
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        class="bi bi-arrow-down-short" viewBox="0 0 16 16" onclick="sortByColumn('createdBy', 'DESC')">
                        <path fill-rule="evenodd"
                            d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        class="bi bi-arrow-up-short" viewBox="0 0 16 16" onclick="sortByColumn('createdBy', 'ASC')">
                        <path fill-rule="evenodd"
                            d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5" />
                    </svg>
                </th>
                <th scope="col">Action</th>
            </tr>
        </thead>
        <tbody id="courseData">
            <tr>
                <td>
                    <div class="d-flex justify-content-center">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden"></span>
                        </div>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
    <nav aria-label="Page navigation example">
        <ul class="pagination justify-content-center" id="pagination">
        </ul>
    </nav>
    <%- include('../../partials/footer.ejs') %>
        <script>
            var currentPage = 1;
            var tableData = document.getElementById("courseData");
            var limit = document.getElementById("limit").value;
            var paginationDom = document.getElementById("pagination");

            var columnSortOrders = {
                courseName: 'ASC'
            };
            var currentColumn = 'createdAt';
            var url = `&orderby=c.${currentColumn}&sort=DESC`;

            function changeLimit() {
                limit = document.getElementById("limit").value
                coursePage()
            }

            function sortByColumn(column, sortOrder) {
                columnSortOrders[column] = sortOrder;
                currentColumn = column;
                url = `&orderby=c.${currentColumn}&sort=${sortOrder}`;
                coursePage(currentPage);
            }

            function coursePage(pageNo = 1) {
                currentPage = pageNo
                var requestOptions = {
                    method: 'GET'
                };

                fetch(`http://localhost:1000/api/course?limit=${limit}&page=${pageNo}` + url,
                    requestOptions)
                    .then(response => response.json())
                    .then(responseData => {
                        const { courses, courseCount } = responseData;
                        let trHtml = '';
                        for (let i = 0; i < courses.length; i++) {
                            const course = courses[i];
                            trHtml += `<tr>
                            <td>${(pageNo - 1) * limit + i + 1}</td>
                            <td>${course.courseName}</td>
                            <td>${course.createdFirstName} ${course.createdLastName}</td>
                            <td>   
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="readCourse(${course.courseId})">
                                <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139q.323-.119.684-.12h5.396z"/>
                                </svg>
                            <div class="modal fade" id="courseModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Full Details</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">X</button>
                                    </div>
                                    <div class="modal-body" id="courseModalBody>
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                                <a href="/course/${course.courseId}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                                </svg></a>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-trash" onClick="deleteCourse(${course.courseId})" viewBox="0 0 16 16">
                                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                </svg>
                            </td>
                        </tr>`;
                        }
                        tableData.innerHTML = trHtml;

                        var totalPages = Math.ceil(responseData.courseCount / limit)
                        var paginationHtml = ''
                        for (var i = 1; i <= totalPages; i++) {
                            paginationHtml += `<li class="page-item">
                          <a class="page-link" href="#" onclick="coursePage(${i})">${i}</a>
                       </li>`;
                        }
                        paginationDom.innerHTML = paginationHtml;
                    })
                    .catch((error) => console.error(error));
            }

            function readCourse(courseId) {
                var myHeaders = new Headers();
                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders
                };

                fetch("http://localhost:1000/api/course/" + courseId, requestOptions)
                    .then(response => response.json())
                    .then(course => {
                        console.log('Course data:', course);
                        const modalHtml = `
                                        <div class="row">
                                            <div class="col-sm-4">
                                                <strong>Course Name :</strong>
                                            </div>
                                            <div class="col-sm-8">
                                                ${course.courseName}
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-sm-4">
                                                <strong>Created At :</strong>
                                            </div>
                                            <div class="col-sm-8">
                                                ${course.createdTimeStamp}
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-sm-4">
                                                <strong>Created By :</strong>
                                            </div>
                                            <div class="col-sm-8">
                                                ${course.createdFirstName} ${course.createdLastName}
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-sm-4">
                                                <strong>updated At :</strong>
                                            </div>
                                            <div class="col-sm-8">
                                                ${course.updatedTimeStamp}
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-sm-4">
                                                <strong>updated By :</strong>
                                            </div>
                                            <div class="col-sm-8">
                                                ${course.updatedFirstName} ${course.updatedLastName}
                                            </div>
                                        </div>`;
                        document.getElementById("courseModalBody").innerHTML = modalHtml;

                        // Show the modal
                        var modal = new bootstrap.Modal(document.getElementById('courseModal'));
                        modal.show();
                    })
                    .catch(error => console.log('error', error));
            }

            function deleteCourse(courseId) {
                var validateDelete = confirm('are you sure you want to delete?')

                if (!validateDelete)
                    return

                var requestOptions = {
                    method: 'DELETE',
                };

                fetch("http://localhost:1000/api/course/" + courseId, requestOptions)
                    .then(response => response.text())
                    .then(deleted =>
                        window.location = '/course'
                    )
                    .catch(error => console.log('error', error));
            }

            window.addEventListener('load', () => {
                coursePage()
            })

        </script>