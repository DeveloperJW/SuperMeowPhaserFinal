<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Phaser Virtual Joystick Plugin Examples Export</title>
    <link href="css/bootstrap.min.css" rel="stylesheet">
</head>

<body>

<?php
    $header = file_get_contents('head.html');
    $footer = file_get_contents('foot.html');

    $path = '../src/';
    $files = dirToArray($path);

    function dirToArray($dir) {

        global $header;
        global $footer;

        $ignore = array('.', '..', 'assets', 'js', 'css', 'fonts', 'lib');
        $result = array(); 
        $root = scandir($dir); 
        $dirs = array_diff($root, $ignore);

        foreach ($dirs as $key => $value) 
        { 
            if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) 
            { 
                $result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value); 
            } 
            else 
            {
                if (substr($value, -3) === '.js')
                {
                    $src = file_get_contents($dir . $value);

                    $output = $header . $src . $footer;

                    $filename = str_replace('.js', '.html', $value);

                    file_put_contents("../$filename", $output);

                    echo "$value <br>";
                }
            } 
        } 

        return $result; 
    } 
?>

</body>
</html>