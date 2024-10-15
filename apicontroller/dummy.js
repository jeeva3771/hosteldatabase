<!DOCTYPE html>
<html>

<head>
  <!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.2/css/bootstrap.min.css">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.2/js/bootstrap.min.js"></script> -->

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  
  <title>
    <%=title %>
  </title>
  <style>
    .container-main {
      width: 90%;
      margin: 0 5%;
    }

    .controlAlign {
      padding-inline-start: 0%;
    }

    .hidden {
      display: none;
    }

    .focus:hover {
      fill: #007bff;
      cursor: pointer;
    }

    .focus:hover {
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }

    .focus:focus {
      fill: #007bff;
      transform: scale(1.1);
    }

    .sortIcon:hover {
      fill: #060607;
      cursor: pointer;
    }


    .sortIcon:hover {
      fill: #060607;
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }

    .sortIcon:focus {
      fill: #060607;
      transform: scale(1.5);
    }
  </style>
</head>

<body>
  <div class="container-main container">
    <% if(isMenuVisible===true) { %>
      <header>
        <nav class="navbar navbar-expand-lg bg-body-tertiary navbar-light controlAlign">
          <div class="container-fluid">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link active focus" aria-current="page" href="/home">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link active focus" aria-current="page" href="/student">Student</a>
              </li>
              <li class="nav-item">
                <a class="nav-link active focus" aria-current="page" href="/attendance">Attendance</a>
              </li>
              <li class="nav-item hidden">
                <a class="nav-link active" aria-current="page" href="/error">Errors</a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Structure
                </a>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="/block">Block</a></li>
                  <li><a class="dropdown-item" href="/blockfloor">Blockfloor</a></li>
                  <li><a class="dropdown-item" href="/room">Room</a></li>
                  <li><a class="dropdown-item" href="/course">Course</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" href="/warden">Warden</a></li>
                </ul>
              </li>
            </ul>
            <div class="d-flex align-items-end ms-auto">
              <span class="navbar-text">
                <%= user.name %>
              </span>
              <a href="/api/logout" class="btn btn-light">Logout</a>
            </div>
          </div>
        </nav>

        <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='%236c757d'/%3E%3C/svg%3E&#34;);" aria-label="breadcrumb">
          <ol class="breadcrumb">
            <% for (let i = 0; i < bred.length; i++) { %>
              <% if (i === bred.length - 1) { %>
                <li class="breadcrumb-item active" aria-current="page"><%= bred[i].name %></li>
              <% } else { %>
                <li class="breadcrumb-item"><a href="<%= bred[i].link %>"><%= bred[i].name %></a></li>
              <% } %>
            <% } %>
          </ol>
        </nav>
        </header>
      <% } %></div>