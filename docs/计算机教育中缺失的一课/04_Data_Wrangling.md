# 数据整理

不断地对数据进行处理，直到得到我们想要的最终结果。

在之前的课程中，其实我们已经接触到了一些数据整理的基本技术。可以这么说，每当您使用**管道运算符**的时候，其实就是在进行某种形式的数据整理。

> [!tip]
>
> `journalctl | grep -i intel`
>
> 它会找到所有包含 intel（不区分大小写）的系统日志。
>
> 将某种形式的数据（全部系统日志）转换成了另外一种形式的数据（仅包含 intel 的日志）

## 日志处理

日志处理通常是一个比较典型的使用场景，因为我们经常需要在日志中查找某些信息，这种情况下通读日志是不现实的。

> 看看哪些用户曾经尝试过登录我们的服务器并且把涉及 sshd 的信息过滤出来：
>
> ```bash
> ssh myserver journalctl | grep sshd
> ```
>
> 注意，这里我们使用管道将一个远程服务器上的文件传递给本机的 `grep` 程序
>
> ```bash
> ssh myserver 'journalctl | grep sshd | grep "Disconnected from"' | less
> ```
>
> 采取另外一种方式，我们先在远端机器上过滤文本内容，然后再将结果传输到本机。 **`less` 为我们创建来一个文件分页器**，使我们可以通过翻页的方式浏览较长的文本。
>
> 甚至可以将当前过滤出的日志保存到文件中，这样后续就不需要再次通过网络访问该文件了：
>
> ```bash
> $ ssh myserver 'journalctl | grep sshd | grep "Disconnected from"' > ssh.log
> $ less ssh.log
> ```

## `sed`

> [!note]
>
> `sed` 是一个基于文本编辑器 `ed` 构建的 “流编辑器” 。
>
> 在 `sed` 中，基本上是利用一些简短的命令来修改文件，而不是直接操作文件的内容

> [!important]
>
> 最常用的是 `s`，即 *替换* 命令，例如我们可以这样写：
>
> ```bash
> ssh myserver journalctl
>  | grep sshd
>  | grep "Disconnected from"
>  | sed 's/.*Disconnected from //'
> ```
>
> `s` 命令的语法如下：`s/REGEX/SUBSTITUTION/`, 其中 `REGEX` 部分是我们需要使用的正则表达式，而 `SUBSTITUTION` 是用于替换匹配结果的文本。

## 正则表达式

从这一句正则表达式开始学习： `/.*Disconnected from /`

> [!note]
>
> 不同字符所表示的含义，根据正则表达式的实现方式不同，也会有所变化，这一点确实令人沮丧。常见的模式有：
>
> - `.` 除换行符之外的 “任意单个字符”
> - `*` 匹配前面字符零次或多次
> - `+` 匹配前面字符一次或多次
> - `[abc]` 匹配 `a`, `b` 和 `c` 中的任意一个
> - `(RX1|RX2)` 任何能够匹配 `RX1` 或 `RX2` 的结果
> - `^` 行首
> - `$` 行尾

> [!tip]
>
> `sed` 的正则表达式需要你在这些模式前添加 `\` 才能使其具有特殊含义。
>
> 也可以添加 `-E` 选项来支持这些匹配
>
> 注意：这里是因为正则表达式不同版本要求不同

> [!warning]
>
> 某些正则表达式的实现来说，您可以给 `*` 或 `+` 增加一个 `?` 后缀使其变成非贪婪模式，但是很可惜 `sed` 并不支持该后缀
>
> 可以切换到 perl 的命令行模式，该模式支持编写这样的正则表达式：
>
> ```bash
> perl -pe 's/.*?Disconnected from //'
> ```

- 匹配用户名后面的文本，尤其是当这里的用户名可以包含空格时，这个问题变得非常棘手！这里我们需要做的是匹配 *一整行*：

  > ```bash
  >  | sed -E 's/.*Disconnected from (invalid |authenticating )?user .* [^ ]+
  > ```
  >
  > `[^ ]+` 会匹配任意非空且不包含空格的序列

- 我们实际上希望能够将用户名*保留* 下来。

  > ```bash
  >  | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
  > ```
  >
  > 对此，我们可以使用“**捕获组**（capture groups）”来完成。被圆括号内的正则表达式匹配到的文本，都会被存入一系列以编号区分的捕获组中。捕获组的内容可以在替换字符串时使用（有些正则表达式的引擎甚至支持替换表达式本身），例如 `\1`、 `\2`、`\3` 等等

---

## 回到数据整理

> [!tip]
>
> ```bash
> ssh myserver journalctl
>  | grep sshd
>  | grep "Disconnected from"
>  | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
> ```
>
> `sed` ：(使用 `i` 命令)，打印特定的行 ,(使用 `p` 命令)，基于索引选择特定行

- 过滤出那些最常出现的用户

  > [!note]
  >
  > ```bash
  > ssh myserver journalctl
  >  | grep sshd
  >  | grep "Disconnected from"
  >  | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
  >  | sort | uniq -c
  >  | sort -nk1,1 | tail -n10
  > ```
  >
  > - `sort` 会对其输入数据进行排序。
  > - `uniq -c` 会把连续出现的行折叠为一行并使用出现次数作为前缀
  > - `-n` 会按照数字顺序对输入进行排序（默认情况下是按照字典序排序 
  > - `-k1,1` 则表示“仅基于以空格分割的第一列进行排序”。
  > - `n` 部分表示“仅排序到第 n 个部分”，默认情况是到行尾。
  > - 希望得到登录次数最少的用户，我们可以使用 `head` 来代替 `tail`。或者使用 `sort -r` 来进行倒序排序。

- 只想获取用户名，而且不要一行一个地显示

  > ```bash
  > ssh myserver journalctl
  >  | grep sshd
  >  | grep "Disconnected from"
  >  | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
  >  | sort | uniq -c
  >  | sort -nk1,1 | tail -n10
  >  | awk '{print $2}' | paste -sd,
  > ```
  >
  > - `paste` 命令来合并行(`-s`)，并指定一个分隔符进行分割 (`-d`)

---

## `awk`

- `awk` 其实是一种编程语言，只不过它碰巧非常善于处理文本。

  > [!note]
  >
  > `awk` 程序接受一个模式串（可选），以及一个代码块，指定当模式匹配时应该做何种操作
  >
  > 默认当模式串即匹配所有行（上面命令中当用法）( `{print $2}` )
  >
  > 其中：
  >
  > 代码块中，`$0` 表示整行的内容，`$1` 到 `$n` 为一行中的 n 个区域，区域的分割基于 `awk` 的域分隔符（默认是空格，可以通过 `-F` 来修改）

- 统计一下所有以 `c` 开头，以 `e` 结尾，并且仅尝试过一次登录的用户。

  > ```bash
  > | awk '$1 == 1 && $2 ~ /^c[^ ]*e$/ { print $2 }' | wc -l
  > ```
  >
  > - 该匹配要求文本的第一部分需要等于 1（这部分刚好是 `uniq -c` 得到的计数值）
  > - 第二部分必须满足给定的一个正则表达式
  > - 代码块中的内容则表示打印用户名
  > - `wc -l` 统计输出结果的行数

- `awk` 是一种编程语言

  > ```bash
  > BEGIN { rows = 0 }
  > $1 == 1 && $2 ~ /^c[^ ]*e$/ { rows += $1 }
  > END { print rows }
  > ```
  >
  > `BEGIN` 也是一种模式，它会匹配输入的开头（ `END` 则匹配结尾）
  >
  > 对每一行第一个部分进行累加，最后将结果输出

---

## 分析数据

1. 将每行数字加起来：

   ```bash
    | paste -sd+ | bc -l
    #或者
    echo "2*($(data | paste -sd+))" | bc -l
   ```

2. R语言的st

   > ```bash
   > ssh myserver journalctl
   >  | grep sshd
   >  | grep "Disconnected from"
   >  | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
   >  | sort | uniq -c
   >  | awk '{print $1}' | R --slave -e 'x <- scan(file="stdin", quiet=TRUE); summary(x)'
   >  # summary 可以打印某个向量的统计结果。我们将输入的一系列数据存放在一个向量后，利用 R 语言就可以得到我们想要的统计数据。
   > ```
   >
   > R 也是一种编程语言，适合被用来进行数据分析和 [绘制图表](https://ggplot2.tidyverse.org/)

3. `gnuplot`绘图 

   > 绘制一些简单的图表， `gnuplot` 可以帮助到您：
   >
   > ```bash
   > ssh myserver journalctl
   >  | grep sshd
   >  | grep "Disconnected from"
   >  | sed -E 's/.*Disconnected from (invalid |authenticating )?user (.*) [^ ]+ port [0-9]+( \[preauth\])?$/\2/'
   >  | sort | uniq -c
   >  | sort -nk1,1 | tail -n10
   >  | gnuplot -p -e 'set boxwidth 0.5; plot "-" using 1:xtic(2) with 
   > ```

4. 利用数据整理确定参数

   > 利用数据整理技术从一长串列表里找出你所需要安装或移除的东西
   >
   > 使用`xargs`实现
   >
   > ```bash
   > rustup toolchain list | grep nightly | grep -vE "nightly-x86" | sed 's/-x86.*//' | xargs rustup toolchain uninstall
   > ```

5. 整理二进制数据

   > 可以用 ffmpeg 从相机中捕获一张图片，将其转换成灰度图后通过 SSH 将压缩后的文件发送到远端服务器，并在那里解压、存档并显示。
   >
   > ```bash
   > ffmpeg -loglevel panic -i /dev/video0 -frames 1 -f image2 -
   >  | convert - -colorspace gray -
   >  | gzip
   >  | ssh mymachine 'gzip -d | tee copy.jpg | env DISPLAY=:0 feh -'
   > ```

---

