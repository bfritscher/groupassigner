<?php
//cors();
define(GOOGLE_FULL_CLIENT_ID, "791894532646-u29r006qaf1avmtk0sl1sn4094ge4vo9.apps.googleusercontent.com");


session_start(); 

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$mysqli = new mysqli("localhost", "groups", "3hB2TKPY", "fritscherch3");
if ($mysqli->connect_errno) {
    echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
}

$mysqli->query('SET CHARACTER SET utf8');

//can be public user or private
if($_SESSION['user_id']){
  $user_id = $_SESSION['user_id'];
}else{
  $user_id = 1;
}

switch($_GET['action']){
  case 'listcourses':
    echo json_encode(listCourses($user_id));
    die();
    break;
  case 'createcourse':
    echo createCourse($user_id, $_POST['name']);
    die();
    break;
  case 'login':
    if($_GET['user_id'] && $_GET['token']){
      //check token
      $mToken = $_GET['token'];
      $userinfo = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' . $mToken;
      $json = file_get_contents($userinfo);
      $userInfoArray = json_decode($json,true);
      $tokenAudience = $userInfoArray['audience'];
      if ( strcasecmp( $tokenAudience, GOOGLE_FULL_CLIENT_ID ) === 0) {
        $_SESSION['user_id'] = $_GET['user_id'];
        setcookie("trylogin", "1", 0);
        echo json_encode(listCourses($_GET['user_id']));
        die();
      }
    }
    header('HTTP/1.0 403 Forbidden');
    die();
    break;
  case 'logout':
    //remove PHPSESSID from browser
    if ( isset( $_COOKIE[session_name()] ) )
    setcookie( session_name(), "", time()-3600, "/");
    setcookie( "trylogin", "", time()-3600);
    //clear session from globals
    $_SESSION = array();
    //clear session from disk
    session_destroy();
    echo json_encode(listCourses(1));
    die();
    break;
  default:
}

//verify that user has rights to course_id for all below
if($_GET['course_id'] && !checkCoursePermission($user_id, $_GET['course_id'])){
  header('HTTP/1.0 403 Forbidden');
  die();
}


switch($_GET['action']){
  case 'getcourse':
    echo json_encode(getCourse($_GET['course_id'] ));
    break;
  case 'getgroups':
    echo json_encode(getGroups($_GET['course_id'] ));
    break;
  case 'getround':
    echo json_encode(getRound($_GET['course_id'], $_GET['round']));
    break;
  case 'getstudentsforgroup':
    echo json_encode(getAllAvailableStudentsForGroup($_GET['course_id'], $_GET['round'], $_GET['group']));
  break;
  case 'updatestudents':
    if($_POST['students']){
      updateStudents($_GET['course_id'], $_POST['students']);
    }
    echo getNextRound($_GET['course_id']);
  break;
  case 'addstudenttogroup':
    addStudentToGroup($_GET['course_id'], $_GET['round'], $_GET['group'], $_POST['student']);
    echo json_encode(getAllAvailableStudentsForGroup($_GET['course_id'], $_GET['round'], $_GET['group']));
  break;
  case 'removestudentfromgroup':
    removeStudentFromGroup($_GET['course_id'], $_GET['round'], $_POST['student']);
    echo json_encode(getAllAvailableStudentsForGroup($_GET['course_id'], $_GET['round'], $_GET['group']));
  break;
  case 'deletegroup':
    deleteGroup($_GET['course_id'], $_GET['round'], $_GET['group']);
    echo '';
  break;
  case 'deleteround':
    deleteRound($_GET['course_id'], $_GET['round']);
    echo '';
  break;
  case 'deletecourse':
    deleteCourse($_GET['course_id']);
    echo '';
  break;
  case 'make':  
    if($_GET['course_id'] && $_GET['groups']){
      $round = getNextRound($_GET['course_id']);
      if($_POST['students']){
        updateStudents($_GET['course_id'], $_POST['students']);
      }
      makeGroups($_GET['course_id'], $round, $_GET['groups']);
      echo json_encode(getGroups($_GET['course_id'] ));
    }
    break;
  case 'fill':
    makeGroups($_GET['course_id'], $_GET['round'], $_GET['groups']);
    echo json_encode(getRound($_GET['course_id'], $_GET['round']));
  break;  
  case 'crosstab':
    if($_GET['course_id']){
      echo json_encode(getCrossTab($_GET['course_id']));
    }
    break;
  default:
    header("HTTP/1.0 404 Not Found");
}

function createCourse($user_id, $name){
  global $mysqli;
  $stmt = $mysqli->prepare("INSERT INTO courses(name, user_id) VALUE (?, ?)");
  $stmt->bind_param('ss', $name, $user_id);
  $stmt->execute();
  $stmt->close();
  return $mysqli->insert_id;
}

function checkCoursePermission($user_id, $course_id){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT id FROM courses WHERE user_id = ? AND id = ?;");
  $stmt->bind_param('si', $user_id, $course_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $num_rows = count($res->fetch_all(MYSQLI_ASSOC));
  $stmt->close();
  return $num_rows > 0;
}

function listCourses($user_id){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT id, name FROM courses WHERE user_id = ?;");
  $stmt->bind_param('s', $user_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_ASSOC);
  $stmt->close();
  return $rows;
}

function getCourse($course_id){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT c.id, c.name, GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR '\n') students
FROM students s
RIGHT JOIN courses c
ON c.id = s.course_id
WHERE c.id = ?
GROUP BY c.id, c.name");
  $stmt->bind_param('i', $course_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_ASSOC);
  $stmt->close();
  return $rows;
}

function getGroups($course_id){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT round, group_label, student
FROM assignments
WHERE course_id = ?
ORDER BY round,  group_label, student;");
  $stmt->bind_param('i', $course_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_NUM);
  $stmt->close();
  return $rows;
}

function getRound($course_id, $round){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT group_label, student
FROM assignments
WHERE course_id = ?
AND round = ?
ORDER BY group_label, student;");
  $stmt->bind_param('ii', $course_id, $round);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_NUM);
  $stmt->close();
  return $rows;
}

function getAllAvailableStudentsForGroup($course_id, $round, $group_label){
  $total_students = getNumberToAssign($course_id, $round);
  $students = array();
  $count_students = 0;
  $students[0] = getAvailableStudentsForGroup($course_id, $round, $group_label);
  $count_students += count($students[0]);
  $n=1;
  while($count_students < $total_students){
    $rows = getAvailableStudentsForGroupSeenNTimes($course_id, $round, $group_label, $n);
    $students[$n] = $rows;
    $count_students += count($rows);  
    $n++;
  }
  return $students;
}

function getAvailableStudentsForGroup($course_id, $round, $group_label){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT name FROM students
  WHERE course_id = ? 
  AND name NOT IN ( -- not used for this round
    SELECT student
    FROM assignments
      WHERE course_id = ?
      AND round = ?
  )
  AND name NOT IN ( -- not seen by members already in group
    SELECT s2.student
      FROM assignments s1
      JOIN assignments s2
      ON s1.course_id = s2.course_id
      AND s1.round=s2.round
      AND s1.group_label = s2.group_label
      AND s1.student <> s2.student
      AND s1.course_id = ?
      JOIN assignments s3
      ON s3.course_id = ? 
      AND s3.round = ? 
      AND s3.group_label = ? 
      AND s3.student = s1.student   
  );");
  $stmt->bind_param('iiiiiii', $course_id, $course_id, $round, $course_id, $course_id, $round, $group_label);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_NUM);
  $stmt->close();
  return $rows;
}


function getAvailableStudentsForGroupSeenNTimes($course_id, $round, $group_label, $n){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT student, GROUP_CONCAT(other ORDER BY other SEPARATOR '\n') as names
FROM (SELECT s2.student, COUNT(*) AS nb, CONCAT(COUNT(*), 'x ', s1.student) as other
      FROM assignments s1
      JOIN assignments s2
      ON s1.course_id = s2.course_id
      AND s1.round=s2.round
      AND s1.group_label = s2.group_label
      AND s1.student <> s2.student
      AND s1.course_id = ?
      JOIN assignments s3
      ON s3.course_id = ?
      AND s3.round = ?
      AND s3.group_label = ?
      AND s3.student = s1.student  
GROUP BY s1.student, s2.student
) AS seen
WHERE student NOT IN ( -- not used for this round
    SELECT student
    FROM assignments
      WHERE course_id = ?
      AND round = ?
  )
GROUP BY student
HAVING SUM(nb) = ?;");
  $stmt->bind_param('iiiiiii', $course_id, $course_id, $round, $group_label, $course_id, $round, $n);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_NUM);
  $stmt->close();
  return $rows;
}

function getNextRound($course_id){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT MAX(round) AS nb FROM assignments
    WHERE course_id = ?
    GROUP BY course_id");
  $stmt->bind_param('d', $course_id);
  $stmt->execute();
  $stmt->bind_result($lastRound);
  $stmt->fetch();
  $stmt->close();
  return $lastRound + 1;
}

function updateStudents($course_id, $students){
  global $mysqli;
  
  $stmt = $mysqli->prepare("DELETE FROM students WHERE course_id = ?");
  $stmt->bind_param("i", $course_id);
  $stmt->execute();
  $stmt->close();
  $stmt = $mysqli->prepare("INSERT INTO students (name, course_id) VALUES (?,?)");
  foreach (explode("\n", $students) as $name){
      $stmt->bind_param("si", $name,$course_id);
      $stmt->execute();
  }
  $stmt->close();
}

function addStudentToGroup($course_id, $round, $group, $student){
  global $mysqli;
  $stmt = $mysqli->prepare("INSERT INTO assignments (course_id, round, group_label, student) VALUES (?,?,?,?)");
  $stmt->bind_param("iiis", $course_id, $round, $group, $student);
  $stmt->execute();
  $stmt->close();
}

function removeStudentFromGroup($course_id, $round, $student){
  global $mysqli;
  $stmt = $mysqli->prepare("DELETE FROM assignments WHERE course_id = ? AND round = ? AND student = ?");
  $stmt->bind_param("iis", $course_id, $round, $student);
  $stmt->execute();
  $stmt->close();
}

function deleteGroup($course_id, $round, $group){
  global $mysqli;
  $stmt = $mysqli->prepare("DELETE FROM assignments WHERE course_id = ? AND round = ? AND group_label = ?");
  $stmt->bind_param("iii", $course_id, $round, $group);
  $stmt->execute();
  $stmt->close();
}

function deleteRound($course_id, $round){
  global $mysqli;
  $stmt = $mysqli->prepare("DELETE FROM assignments WHERE course_id = ? AND round = ?");
  $stmt->bind_param("ii", $course_id, $round);
  $stmt->execute();
  $stmt->close();
}

function deleteCourse($course_id){
  global $mysqli;
  $stmt = $mysqli->prepare("DELETE FROM courses WHERE id = ?");
  $stmt->bind_param("i", $course_id);
  $stmt->execute();
  $stmt->close();
}

function getNumberToAssign($course_id, $round){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT COUNT(*) FROM students
  WHERE course_id = ?
  AND name NOT IN ( -- not used for this round
    SELECT student
    FROM assignments
      WHERE course_id = ?
      AND round = ?
  )");
  $stmt->bind_param('iii', $course_id, $course_id, $round);
  $stmt->execute();
  $stmt->bind_result($total_students);
  $stmt->fetch();
  $stmt->close();
  return $total_students;
}

function makeGroups($course_id, $round, $group_count){
  global $mysqli;
  
  $total_students = getNumberToAssign($course_id, $round);
  
  //init groups
  $groups = array();
  for($g=1; $g <= $group_count; $g++){
    $groups['g' . $g] = 0;
  }
  
  //fetch existing
  $stmt = $mysqli->prepare("SELECT group_label, COUNT(*) AS total
FROM assignments
WHERE course_id =?
AND round = ?
GROUP BY group_label");
  $stmt->bind_param('ii', $course_id, $round);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_NUM);
  $stmt->close();

  foreach($rows as $row){
    $groups['g' . $row[0]] = $row[1];
  }
  
  while($total_students > 0){
    //get lowest group count
    array_multisort(array_values($groups), SORT_ASC, array_keys($groups), SORT_ASC, $groups); //SORT_NATURAL when on php 5.4
    $sorted = array_keys($groups);
    $g = substr($sorted[0], 1);
    //gets students not seen in people of group g in all r
    $rows = getAvailableStudentsForGroup($course_id, $round, $g);
    if(count($rows) == 0){
      //if none get students not seen in people of g in all - 1 r
      $n=0;
      do {
        $n++;
        $rows = getAvailableStudentsForGroupSeenNTimes($course_id, $round, $g, $n);
      } while(count($rows) == 0);
    }
    
    //pick random  & insert
    
    $stmt = $mysqli->prepare("INSERT INTO assignments(course_id, round, group_label, student) VALUES (?, ?, ?, ?);");
    $stmt->bind_param('iiss', $course_id, $round, $g, $rows[array_rand($rows)][0]);
    if($stmt->execute()){
      $total_students--;
      $groups['g' . $g]++;
    }
    $stmt->close();
  }
}

function getCrossTab($course_id){
  global $mysqli;
  $stmt = $mysqli->prepare("SELECT s.name as 'from', b.student as 'to', COUNT(*) as 'count',
GROUP_CONCAT(CONCAT('Round ', b.round, ' Group ', b.group_label) ORDER BY b.round, b.group_label SEPARATOR '\n') as 'when'
FROM students s
LEFT JOIN assignments a ON 
s.name = a.student
AND s.course_id = a.course_id
LEFT JOIN assignments b
ON a.course_id = b.course_id
AND a.round = b.round
AND a.group_label = b.group_label
WHERE s.course_id = ?
GROUP BY s.name, b.student
ORDER BY 'from', 'to';");
  $stmt->bind_param('i', $course_id);
  $stmt->execute();
  $res = $stmt->get_result();
  $rows = $res->fetch_all(MYSQLI_NUM);
  $stmt->close();
  return $rows;
}

//http://stackoverflow.com/questions/8719276/cors-with-php-headers
function cors() {

    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: *");
        header('Access-Control-Allow-Credentials: true');
    }

    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

        exit(0);
    }
}

?>