# the Shell



 ## shell 是什么？

文字接口：Shell

> 允许你执行程序，输入并获取某种半结构化的输出

---



## 使用Shell

- 打开终端，看到一个提示符:`missing:~$`

> shell 是最主要的文本接口
>
> 主机名是 `missing`
>
> 当前的工作目录（”current working directory”）或者说您当前所在的位置是 `~` (表示 “home”)
>
> `$` 符号表示您现在的身份不是 root 用户

- 传递的参数中包含空格（例如一个名为 My Photos 的文件夹），用使用单引号，双引号将其包裹起来，要么使用转义符号 `\` 进行处理（`My\ Photos`）。

- ```shell
  missing:~$ date
  Fri 10 Jan 2020 11:49:31 AM EST
  missing:~$ echo hello
  hello
  ```

- 对于命令`date 和 echo`,shell 是一个编程环境，所以它具备变量、条件、循环和函数，在 shell 中执行命令时，您实际上是在执行一段 shell 可以解释执行的简短代码，该指令并不是 shell 所了解的编程关键字，那么它会去咨询 *环境变量* `$PATH`

- ```bash
  missing:~$ echo $PATH
  /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
  missing:~$ which echo
  /bin/echo
  missing:~$ /bin/echo $PATH
  /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
  ```

- 例如：执行 `echo` 命令时，shell 会在 `$PATH` 中搜索由 `:` 所分割的一系列目录，基于名字搜索该程序。（定某个程序名代表的是哪个具体的程序，可以使用 `which` 程序）。

- 所以我们也可以绕过 `$PATH`，通过直接指定需要执行的程序的路径来执行该程序

---



## 在 shell 中导航

- shell 中的路径是一组被分割的目录，在 Linux 和 macOS 上使用 `/` 分割

- 路径 `/` 代表的是系统的根目录

  > - 某个路径以 `/` 开头，那么它是一个 *绝对路径*
  > - 不是以`/`开头的其他的都是 *相对路径*，相对路径是指相对于当前工作目录的路径

- 当前工作目录可以使用 `pwd` 命令来获取

- 切换目录需要使用 `cd` 命令。在路径中，`.` 表示的是当前目录，而 `..` 表示上级目录：

- ```shell
  missing:~$ pwd
  /home/missing
  missing:~$ cd /home
  missing:/home$ pwd
  /home
  missing:/home$ cd ..
  missing:/$ pwd
  /
  missing:/$ cd ./home
  missing:/home$ pwd
  /home
  missing:/home$ cd missing
  missing:~$ pwd
  /home/missing
  missing:~$ ../../bin/echo hello
  hello
  ```

- `mv`（用于重命名或移动文件）、 `cp`（拷贝文件）以及 `mkdir`（新建文件夹）
- `man` 这个程序。它会接受一个程序名作为参数，然后将它的文档（用户手册）展现

---



## 文件权限

```bash
missing:~$ ls -l /home
drwxr-xr-x 1 missing  users  4096 Jun 15  2019 missing
```

1. 第一栏共有十个字符，第一栏代表这个文件的**类型与权限**(permission)：

> - 第一个字符代表这个文件是『目录、文件或链接文件等等』：
>
>   - 当为[ **d** ]则是目录，例如[上表](http://cn.linux.vbird.org/linux_basic/0210filepermission.php#table2.1.1)档名为『.gconf』的那一行；
>
>   - 当为[ **-** ]则是文件，例如[上表](http://cn.linux.vbird.org/linux_basic/0210filepermission.php#table2.1.1)档名为『install.log』那一行；
>   - 若是[ **l** ]则表示为连结档(link file)；
>   - 若是[ **b** ]则表示为装置文件里面的可供储存的接口设备(可随机存取装置)；
>   - 若是[ **c** ]则表示为装置文件里面的串行端口设备，例如键盘、鼠标(一次性读取装置)。
>
> - 下来的字符中，以三个为一组，且均为『rwx』 的三个参数的组合。
>
>   - [ r ]代表可读(read)、[ w ]代表可写(write)、[ x ]代表可执行(execute)。
>   - 第一组为『文件拥有者的权限』；
>   - 第二组为『同群组的权限』；
>   - 第三组为『其他非本群组的权限』。

2. 第二栏表示有多少档名连结到此节点(i-node)

3. 第三栏表示这个文件(或目录)的『拥有者账号』

4. 第四栏表示这个文件的所属群组

5. 第五栏为这个文件的容量大小，默认单位为bytes；

6. 第六栏为这个文件的建档日期或者是最近的修改日期

7. 第七栏为这个文件的档名

   > 如果档名之前多一个『 . 』，则代表这个文件为『隐藏档』

---



> [!note]
>
> - **权限意义**
> - 权限对于文件：文件是实际含有数据的地方，包括一般文本文件、数据库内容文件、二进制可执行文件(binary program)等等
>
> > - r (read)：可读取此一文件的实际内容，如读取文本文件的文字内容等；
> > - w (write)：可以编辑、新增或者是修改该文件的内容(但不含删除该文件)；
> > - x (execute)：该文件具有可以被系统执行的权限。
>
> - 权限对于目录：目录主要的内容在记录文件名列表，文件名与目录有强烈的关连
>
> > - **r (read contents in directory)**：
> >
> >   表示具有读取目录结构列表的权限，表示你可以查询该目录下的文件名数据。
> >
> >   - w (modify contents of directory)
> >
> >   具有异动该目录结构列表的权限，也就是底下这些权限：
> >
> >   - 建立新的文件与目录；
> >  - 删除已经存在的文件与目录(不论该文件的权限为何！)
> >   - 将已存在的文件或目录进行更名；
> >   - 搬移该目录内的文件、目录位置。
> > 
> >   总之，目录的w权限就与该目录底下的文件名异动有关
> >
> > - **x (access directory)**：
> >
> >   目录的x代表的是用户能否进入该目录成为工作目录的用途！ 所谓的工作目录(work directory)就是你目前所在的目录

---



## 在程序间创建连接

在 shell 中，程序有两个主要的“流”：它们的**输入流和输出流**。

- 当程序尝试读取信息时，它们会从输入流中进行读取
- 当程序打印信息时，它们会将信息输出到输出流中

通常，一个程序的输入输出流都是您的终端

- 最简单的重定向是 `< file` 和 `> file`

- 还可以使用 `>>` 来向一个文件追加内容。

- `|` 操作符允许我们将一个程序的输出和另外一个程序的输入连接起来

- ```bash
  missing:~$ ls -l / | tail -n1
  drwxr-xr-x 1 root  root  4096 Jun 20  2019 var
  missing:~$ curl --head --silent google.com | grep --ignore-case content-length | cut --delimiter=' ' -f2
  219
  ```

---



## 一个功能全面又强大的工具

- 根用户（root user）
  - 用户几乎不受任何限制，他可以创建、读取、更新和删除系统中的任何文件
  - `sudo` 命令：可以以 su（super user 或 root 的简写）的身份执行一些操作

---

## 课后习题

1. 本课程需要使用类 Unix shell，例如 Bash 或 ZSH。如果您在 Linux 或者 MacOS 上面完成本课程的练习，则不需要做任何特殊的操作。如果您使用的是 Windows，则您不应该使用 cmd 或是 Powershell；您可以使用 [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/) 或者是 Linux 虚拟机。使用 `echo $SHELL` 命令可以查看您的 shell 是否满足要求。如果打印结果为 `/bin/bash` 或 `/usr/bin/zsh` 则是可以的。

2. 在 `/tmp` 下新建一个名为 `missing` 的文件夹。

3. 用 `man` 查看程序 `touch` 的使用手册。

4. 用 `touch` 在 `missing` 文件夹中新建一个叫 `semester` 的文件。

5. 将以下内容一行一行地写入

   ```plaintext
   semester
   ```

   文件：

   ```
    #!/bin/sh
    curl --head --silent https://missing.csail.mit.edu
   ```

   第一行可能有点棘手， `#` 在 Bash 中表示注释，而 `!` 即使被双引号（`"`）包裹也具有特殊的含义。 单引号（`'`）则不一样，此处利用这一点解决输入问题。更多信息请参考 [Bash quoting 手册](https://www.gnu.org/software/bash/manual/html_node/Quoting.html)

6. 尝试执行这个文件。例如，将该脚本的路径（`./semester`）输入到您的 shell 中并回车。如果程序无法执行，请使用 `ls` 命令来获取信息并理解其不能执行的原因。

7. 查看 `chmod` 的手册(例如，使用 `man chmod` 命令)

8. 使用 `chmod` 命令改变权限，使 `./semester` 能够成功执行，不要使用 `sh semester` 来执行该程序。您的 shell 是如何知晓这个文件需要使用 `sh` 来解析呢？更多信息请参考：[shebang](https://en.wikipedia.org/wiki/Shebang_(Unix))

9. 使用 `|` 和 `>` ，将 `semester` 文件输出的最后更改日期信息，写入主目录下的 `last-modified.txt` 的文件中

```bash
./semester |grep "last-modified" > last-modified.txt
```

