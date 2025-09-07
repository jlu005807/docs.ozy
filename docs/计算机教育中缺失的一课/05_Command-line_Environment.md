# 命令行环境

1. 同时执行多个不同的进程并追踪它们的状态、如何停止或暂停某个进程以及如何使进程在后台运行
2. 改善您的 shell 及其他工具的工作流：定义别名或基于配置文件对其进行配置
3. 如何使用 SSH 操作远端机器

## 任务控制

- 中断正在执行的任务：大多数情况下，可以使用 `Ctrl-C` 来停止命令的执行

### 结束进程

 shell 会使用 UNIX 提供的**信号机制**执行进程间通信

> 一个进程接收到信号时，它会停止执行、处理该信号并基于信号传递的信息来改变其执行。信号是一种 *软件中断*。

- 输入 `Ctrl-C` 时，shell 会发送一个 `SIGINT` 信号到进程。

Python 程序向您展示了捕获信号 `SIGINT` 并忽略它的基本操作，它并不会让程序停止。

>  为了停止这个程序，我们需要使用 `SIGQUIT` 信号，通过输入 `Ctrl-\` 可以发送该信号
>
> ```python
> #!/usr/bin/env python
> import signal, time
> 
> def handler(signum, time):
>     print("\nI got a SIGINT, but I am not stopping")
> 
> signal.signal(signal.SIGINT, handler)
> i = 0
> while True:
>     time.sleep(.1)
>     print("\r{}".format(i), end="")
>     i += 1
> ```
>
> `SIGINT` 和 `SIGQUIT` 都常常用来发出和终止程序相关的请求。`SIGTERM` 则是一个更加通用的、也更加优雅地退出信号
>
> 其中 `kill -TERM <PID>`发出`SIGTERM`信号

### 暂停和后台执行进程

-  **`Ctrl-Z`** 

  > `SIGSTOP` 会让**进程暂停**。在终端中，键入 **`Ctrl-Z`** 会让 shell 发送 `SIGTSTP` 信号，`SIGTSTP` 是 Terminal Stop 的缩写（即 `terminal` 版本的 SIGSTOP）。

-  [`fg`](https://www.man7.org/linux/man-pages/man1/fg.1p.html) 或 [`bg`](http://man7.org/linux/man-pages/man1/bg.1p.html) 

  > 同时可以使用 [`fg`](https://www.man7.org/linux/man-pages/man1/fg.1p.html) 或 [`bg`](http://man7.org/linux/man-pages/man1/bg.1p.html) 命令恢复暂停的工作。它们分别表示在前台继续或在后台继续。

- [`jobs`](http://man7.org/linux/man-pages/man1/jobs.1p.html) 

  > 命令会列出当前终端会话中尚未完成的全部任务
  >
  > 以使用 pid 引用这些任务（也可以用 [`pgrep`](https://www.man7.org/linux/man-pages/man1/pgrep.1.html) 找出 pid）
  >
  > 更加符合直觉的操作是您可以使用**百分号 + 任务编号**（`jobs` 会打印任务编号）来选取该任务。如果要选择最近的一个任务，可以使用 **`$!`** 这一特殊参数。

- `&`命令后缀

  > 命令中的 `&` 后缀可以让命令在**直接在后台运行**，这使得您可以直接在 shell 中继续做其他操作，不过它此时还是会使用 shell 的标准输出，这一点有时会比较恼人（这种情况可以使用 shell 重定向处理）。
  >
  > 让已经在运行的进程转到后台运行， `Ctrl-Z` +`bg`。
  >
  > 注意，后台的进程仍然是您的终端进程的**子进程**，一旦您关闭终端（会发送另外一个信号 `SIGHUP`），这些后台的进程也会终止

-  [`nohup`](https://www.man7.org/linux/man-pages/man1/nohup.1.html)

  > 一个用来忽略 `SIGHUP` 的封装）来运行程序。针对已经运行的程序，可以使用 `disown` 



下面这个简单的会话中展示来了些概念的应用。

```bash
$ sleep 1000
^Z
[1]  + 18653 suspended  sleep 1000

$ nohup sleep 2000 &
[2] 18745
appending output to nohup.out

$ jobs
[1]  + suspended  sleep 1000
[2]  - running    nohup sleep 2000

$ bg %1
[1]  - 18653 continued  sleep 1000

$ jobs
[1]  - running    sleep 1000
[2]  + running    nohup sleep 2000

$ kill -STOP %1
[1]  + 18653 suspended (signal)  sleep 1000

$ jobs
[1]  + suspended (signal)  sleep 1000
[2]  - running    nohup sleep 2000

$ kill -SIGHUP %1
[1]  + 18653 hangup     sleep 1000

$ jobs
[2]  + running    nohup sleep 2000

$ kill -SIGHUP %2

$ jobs
[2]  + running    nohup sleep 2000

$ kill %2
[2]  + 18745 terminated  nohup sleep 2000

$ jobs
```

> [!tip]
>
> `SIGKILL` 是一个特殊的信号，它**不能被进程捕获并且它会马上结束该进程**。不过这样做会有一些副作用，例如留下孤儿进程。

---

## 终端多路复用

 [`tmux`](https://www.man7.org/linux/man-pages/man1/tmux.1.html) 这类的终端多路复用器可以允许我们基于面板和标签分割出多个终端窗口，这样您便可以同时与多个 shell 会话进行交互。

`tmux` 的快捷键需要我们掌握，它们都是类似 `<C-a> x` 这样的组合

即需要先按下 `Ctrl+a`，松开后再按下 `x`。

`tmux` 中对象的继承结构如下：

> [!note]
>
> **会话** - 每个会话都是一个独立的工作区，其中包含一个或多个窗口
>
> - `tmux` 开始一个新的会话
> - `tmux new -s NAME` 以指定名称开始一个新的会话
> - `tmux ls` 列出当前所有会话
> - 在 `tmux` 中输入 `<C-b> d` ，将当前会话分离
> - `tmux a` 重新连接最后一个会话。您也可以通过 `-t` 来指定具体的会话
>
> - **窗口** - 相当于编辑器或是浏览器中的标签页，从视觉上将一个会话分割为多个部分
>   - `<C-a> c` 创建一个新的窗口，使用 `<C-d>` 关闭
>   - `<C-a> N` 跳转到第 *N* 个窗口，注意每个窗口都是有编号的
>   - `<C-a> p` 切换到前一个窗口
>   - `<C-a> n` 切换到下一个窗口
>   - `<C-a> ,` 重命名当前窗口
>   - `<C-a> w` 列出当前所有窗口
> - **面板** - 像 vim 中的分屏一样，面板使我们可以在一个屏幕里显示多个 shell
>   - `<C-a> -` 水平分割
>   - `<C-a> |` 垂直分割
>   - `<C-a> <方向> / Alt <方向>` 切换到指定方向的面板，<方向> 指的是键盘上的方向键
>   - `<C-a> z` 切换当前面板的缩放
>   - `<C-a> [` 开始往回卷动屏幕。您可以按下空格键来开始选择，回车键复制选中的部分
>   - `<C-a> <空格>` 在不同的面板排布间切换

## 别名

shell 的别名相当于一个长命令的缩写，shell 会自动将其替换成原本的命令。例如，bash 中的别名语法如下：

```
alias alias_name="command_to_alias arg1 arg2"
```

注意， **`=` 两边是没有空格的**，因为 [`alias`](https://www.man7.org/linux/man-pages/man1/alias.1p.html) 是一个 shell 命令，它只接受一个参数。

```bash
# 创建常用命令的缩写
alias ll="ls -lh"

# 能够少输入很多
alias gs="git status"
alias gc="git commit"
alias v="vim"

# 手误打错命令也没关系
alias sl=ls

# 重新定义一些命令行的默认行为
alias mv="mv -i"           # -i prompts before overwrite
alias mkdir="mkdir -p"     # -p make parent dirs as needed
alias df="df -h"           # -h prints human readable format

# 别名可以组合使用
alias la="ls -A"
alias lla="la -l"

# 在忽略某个别名
\ls
# 或者禁用别名
unalias la

# 获取别名的定义
alias ll
# 会打印 ll='ls -lh'

```

- 值得注意的是，在默认情况下 shell 并不会保存别名。为了让别名持续生效，您需要将配置放进 shell 的启动文件里，像是 .bashrc 或 .zshrc

## 配置文件（Dotfiles）

### 概念

多程序的配置都是通过纯文本格式的被称作 *点文件* 的配置文件来完成的（之所以称为点文件，是因为它们的文件名以 `.` 开头，例如 `~/.vimrc`。也正因为此，它们默认是**隐藏文件**，`ls` 并不会显示它们）

- shell 程序会读取很多文件以加载其配置项。根据 shell 本身的不同，您从登录开始还是以交互的方式完成这一过程可能会有很大的不同。

- 对于 `bash` 来说，在大多数系统下，您可以通过编辑 `.bashrc` 或 `.bash_profile` 来进行配置。
- 实际上，很多程序都要求您在 shell 的配置文件中包含一行类似 **`export PATH="$PATH:/path/to/program/bin"`** 的命令

> [!tip]
>
> - `bash` - `~/.bashrc`, `~/.bash_profile`
> - `git` - `~/.gitconfig`
> - `vim` - `~/.vimrc` 和 `~/.vim` 目录
> - `ssh` - `~/.ssh/config`
> - `tmux` - `~/.tmux.conf`

### 版本控制

如何管理这些配置文件呢？

> [!important]
>
> 在它们的文件夹下，并使用版本控制系统进行管理，然后通过脚本将其 **符号链接** 到需要的地方
>
> - **安装简单**: 如果您登录了一台新的设备，在这台设备上应用您的配置只需要几分钟的时间；
> - **可移植性**: 您的工具在任何地方都以相同的配置工作
> - **同步**: 在一处更新配置文件，可以同步到其他所有地方
> - **变更追踪**: 您可能要在整个程序员生涯中持续维护这些配置文件，而对于长期项目而言，版本历史是非常重要的

### 可移植性

配置文件 if 语句，可以借助它针对不同的设备编写不同的配置。例如，您的 shell 可以这样做：

```bash
if [[ "$(uname)" == "Linux" ]]; then {do_something}; fi

# 使用和 shell 相关的配置时先检查当前 shell 类型
if [[ "$SHELL" == "zsh" ]]; then {do_something}; fi

# 您也可以针对特定的设备进行配置
if [[ "$(hostname)" == "myServer" ]]; then {do_something}; fi
```

配置文件支持 include 功能，您也可以多加利用。例如：`~/.gitconfig` 可以这样编写：

```bash
[include]
    path = ~/.gitconfig_local
```

希望在不同的程序之间共享某些配置，该方法也适用。例如，如果您想要在 `bash` 和 `zsh` 中同时启用一些别名，您可以把它们写在 `.aliases` 里，然后在这两个 shell 里应用：

```bash
# Test if ~/.aliases exists and source it
if [ -f ~/.aliases ]; then
    source ~/.aliases
fi
```

---

## 远程设备

使用 `ssh` 连接到其他服务器：

```bash
ssh c21231511@jlulinux.cn
```

以用户名 `c21231511` 登录服务器 `jlulinux.cn`。服务器可以通过 URL 指定（例如 `bar.mit.edu`），也可以使用 IP 指定（例如 `foobar@192.168.1.42`

### 执行命令

`ssh` 的一个经常被忽视的特性是它可以直接**远程执行命令**。

- `ssh foobar@server ls | grep PATTERN` 会在**本地查询远端 `ls` 的输出**
-  `ls | ssh foobar@server grep PATTERN` 会在**远端对本地 `ls` 输出的结果进行查询**。

### SSH密钥

只需要向服务器证明客户端持有对应的私钥，而不需要公开其私钥。这样您就可以避免每次登录都输入密码的麻烦了秘密就可以登录

私钥(通常是 `~/.ssh/id_rsa` 或者 `~/.ssh/id_ed25519`) 等效于您的密码

### 密钥生成

- 使用 [`ssh-keygen`](http://man7.org/linux/man-pages/man1/ssh-keygen.1.html) 命令可以生成一对密钥：

  > ```bash
  > ssh-keygen -o -a 100 -t ed25519 -f ~/.ssh/id_ed25519
  > ```
  >
  > 您可以为密钥设置密码，防止有人持有您的私钥并使用它访问您的服务器。

- 检查您是否持有密码并验证它，您可以运行 `ssh-keygen -y -f /path/to/key`.

### 基于密钥的认证机制

`ssh` 会查询 `.ssh/authorized_keys` 来确认那些用户可以被允许登录。您可以通过下面的命令将一个公钥拷贝到这里：

```bash
cat .ssh/id_ed25519.pub | ssh foobar@remote 'cat >> ~/.ssh/authoriz'
```

或者

```bash
ssh-copy-id -i .ssh/id_ed25519.pub foobar@remote
```

### 通过SSH复制文件

1. `ssh+tee`, 最简单的方法是执行 `ssh` 命令，然后通过这样的方法利用标准输入实现 `cat localfile | ssh remote_server tee serverfile`。[`tee`](https://www.man7.org/linux/man-pages/man1/tee.1.html) 命令会将标准输出写入到一个文件；
2. [`scp`](https://www.man7.org/linux/man-pages/man1/scp.1.html) ：当需要拷贝大量的文件或目录时，使用 `scp` 命令则更加方便，因为它可以方便的遍历相关路径。语法如下：`scp path/to/local_file remote_host:path/to/remote_file`；
3. [`rsync`](https://www.man7.org/linux/man-pages/man1/rsync.1.html) 对 `scp` 进行了改进，它可以检测本地和远端的文件以防止重复拷贝。它还可以提供一些诸如符号连接、权限管理等精心打磨的功能。甚至还可以基于 `--partial` 标记实现断点续传。`rsync` 的语法和 `scp` 类似；

> [!warning]
>
> 注意，如果不是通过默认的密钥登录服务器的话，在windows系统需要通过补全密钥路径免密登录
>
> `ssh -i  path User@Hostname`
>
> 而在 Linux 系统中，SSH 客户端（`ssh` 命令）**默认会自动尝试使用标准路径下的私钥文件**（如 `~/.ssh/id_rsa`、`~/.ssh/id_ecdsa` 等），而无需手动指定私钥路径。

### 端口转发

- 需要监听特定设备的端口。如果是在您的本机，可以使用 `localhost:PORT` 或 `127.0.0.1:PORT`
- 使用本地端口转发，即远端设备上的服务监听一个端口：`ssh -L 9999:localhost:8888 foobar@remote_server` 。这样只需要访问本地的 `localhost:9999` 即可。

---

### SSH配置

使用 `~/.ssh/config`.

```
Host vm
    User foobar
    HostName 172.16.174.141
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    LocalForward 9999 localhost:8888

# 在配置文件中也可以使用通配符
Host *.mit.edu
    User foobaz
```

这么做的好处是，使用 `~/.ssh/config` 文件来创建别名，类似 `scp`、`rsync` 和 `mosh` 的这些命令都可以读取这个配置并将设置转换为对应的命令行选项。

服务器侧的配置通常放在 `/etc/ssh/sshd_config`。

## 杂项

1. [Mosh](https://mosh.org/)（即 mobile shell ）对 ssh 进行了改进，它允许连接漫游、间歇连接及智能本地回显。
2.  [sshfs](https://github.com/libfuse/sshfs) 可以将远端服务器上的一个文件夹挂载到本地，然后您就可以使用本地的编辑器了。
