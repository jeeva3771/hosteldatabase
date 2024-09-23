<!DOCTYPE html>
<html>

<head>
    <%- include('../../partials/head.ejs') %>
        <style>
            .container {
                margin-top: 60px;
                margin-bottom: 20px;
                padding-top: 14px;
                display: flex;
                flex-direction: column;
                gap: 20px
            }

            .insertLabel {
                height: 36px;
                display: flex;
                justify-content: space-between;
                gap: 114%;
            }

            .table-wrapper {
                width: 100%;
                overflow-x: auto;
                box-shadow: 0 2px 4px rgba(0, 0, 0, .1), 0 8px 16px rgba(0, 0, 0, .1);
            }

            table {
                min-width: 1400px;
            }

        </style>
</head>

<body>
    <div class="container table-wrapper">
        <div class="insertLabel">
            <select class="form-select form-select-lg mb-3 pageCount" aria-label=".form-select-lg example" id="limit"
                onchange="changeLimit()">
                <option value="5" href="#">5</option>
                <option value="10" href="#" selected>10</option>
                <option value="20" href="#">20</option>
                <option value="40" href="#">40</option>
            </select>
            <a class="btn btn-info" href="/course/add">Add</a>
        </div>
        <table class="table table-striped table-hover table-bordered">
            <thead>
                <tr>
                    <th scope="col">Sno</th>
                    <th scope="col">CourseName</th>
                    <th scope="col">CreatedAt</th>
                    <th scope="col">CreatedBy</th>
                    <th scope="col">UpdatedAt</th>
                    <th scope="col">UpdatedBy</th>
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
    </div>
</body>
<script>
    var tableData = document.getElementById("courseData")
    var limit = document.getElementById("limit").value
    var paginationDom = document.getElementById("pagination")
    var insert = false;

    function changeLimit() {
        limit = document.getElementById("limit").value
        loadCoursePage()
    }

    function loadCoursePage(pageNo = 1) {
        var requestOptions = {
            method: 'GET'
        };
       
        var orderBy = insert === true ? 'createdAt' : 'courseName';
        var sort = insert === true ? 'DESC' : 'ASC';

        fetch(`http://localhost:1000/api/course?limit=${limit}&page=${pageNo}&orderby=${orderBy}&sort=${sort}`,
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
                            <td>${course.createdAt}</td>
                            <td>${course.created}</td>
                            <td>${course.updatedAt}</td>
                            <td>${course.updated}</td>
                            <td>
                                <a class="btn btn-secondary" href="/course/${course.courseId}">Edit</a>
                                <a class="btn btn-secondary" onClick="deleteCourse(${course.courseId})">Delete</a>
                            </td>
                        </tr>`;
                }
                tableData.innerHTML = trHtml;

                var totalPages = Math.ceil(responseData.courseCount / limit)
                var paginationHtml = ''
                for (var i = 1; i <= totalPages; i++) {
                    paginationHtml += `<li class="page-item">
                          <a class="page-link" href="#" onclick="loadCoursePage(${i})">${i}</a>
                       </li>`;
                }
                paginationDom.innerHTML = paginationHtml;
            })
            .catch((error) => console.error(error));
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
        loadCoursePage()
    })

</script>

</html>