```
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Free Flag</title>
</head>
<body>
    
<?php


function isRateLimited($limitTime = 1) {
    $ipAddress=$_SERVER['REMOTE_ADDR'];
    $filename = sys_get_temp_dir() . "/rate_limit_" . md5($ipAddress);
    $lastRequestTime = @file_get_contents($filename);
    
    if ($lastRequestTime !== false && (time() - $lastRequestTime) < $limitTime) {
        return true;
    }

    file_put_contents($filename, time());
    return false;
}


    if(isset($_POST['file']))
    {
        if(isRateLimited())
        {
            die("Limited 1 req per second");
        }
        $file = $_POST['file'];
        if(substr(file_get_contents($file),0,5) !== "<?php" && substr(file_get_contents($file),0,5) !== "<html") # i will let you only read my source haha
        {
            die("catched");
        }
        else
        {
            echo file_get_contents($file);
        }
    }

?>
</body>
</html>
```
### Reading the source code

When reading the source code, simply, the application takes a POST value from the request and apply the `file_get_contents` function on it.

after that it compares the first 5 chars if it contains `<?php` or `<html`. If yes then the content will get printed or else we get `catched`

### Analyzing

If you don't know, `file_get_contents` accepts URI if the `allow_url_fopen` option is allowed which is default. which means we can use `php://` and other protocols.

For demonstration :

![Screenshot (186)](https://github.com/user-attachments/assets/f73334ff-ade5-4f55-b22b-5c5408988d23)

As you can see, it gets refelected in our page, however this isn't very helpful, we need to read the flag at `/flag.txt` but it musts start with `<?php` or `<html` so how is this possible?

If we do a quick search `add prefix file_get_contents`, we can find an interesting blog that talks about `wrapwrap` tool : [Blog](https://www.ambionics.io/blog/wrapwrap-php-filters-suffix)

![Screenshot (187)](https://github.com/user-attachments/assets/4409aa22-15e3-47f5-b5f0-99a3328dc470)


So this tool simply automate the process of using the `convert.iconv` and `base64` filters to add prefix to our data in `file_get_contents`, you can read more about this interesting exploit in these links :

[gynvael](https://gynvael.coldwind.pl/?id=671)

[synack tic](https://www.synacktiv.com/en/publications/php-filters-chain-what-is-it-and-how-to-use-it)

But the last version of the tool seems corrupted i used this commit and it works fine :

[wrapwrap](https://github.com/ambionics/wrapwrap/tree/9a182f842797426280d907e11f6201bc9e8e133a)

### Exploitation

Using the command: 

`python wrapwrap.py /flag.txt "<?php " '' 100`

Will produce : 

![Screenshot (188)](https://github.com/user-attachments/assets/475456e2-6da6-45a6-85c5-141624d49b6a)


And we get the flag :

![Screenshot (189)](https://github.com/user-attachments/assets/9e5e231c-3ad0-415e-9333-889eabbb452e)

~ Easy peasy lemon squeezy :)
