# Shell工具和脚本

> [!tip]
>
> 大多数 shell 都有自己的一套脚本语言，包括变量、控制流和自己的语法。
>
> 创建命令流程（pipelines）、将结果保存到文件、从标准输入中读取输入，这些都是 shell 脚本中的原生操作，这让它比通用的脚本语言更易用。

## 变量赋值

> [!important]
>
> 在 bash 中为变量赋值的语法是 `foo=bar`，访问变量中存储的数值，其语法为 `$foo`。

> [!warning]
>
> 注意的是，`foo = bar` （使用空格隔开）是不能正确工作的，因为解释器会调用程序 `foo` 并将 `=` 和 `bar` 作为参数
>
> 在 shell 脚本中**使用空格会起到分割参数**的作用，有时候可能会造成混淆，请务必多加检查。

> 字符串通过 `'` 和 `"` 分隔符来定义
>
> 1. 以 `'` 定义的字符串为**原义字符串**，其中的变量不会被转义
> 2. 而 `"` 定义的字符串会将变量值进行替换。
>
> ```bash
> foo=bar
> echo "$foo"
> # 打印 bar
> echo '$foo'
> # 打印 $foo
> ```

## 函数

 `bash` 也支持函数，它可以接受参数并基于参数进行操作。

> ```bash
> mcd () {
>     mkdir -p "$1"
>     cd "$1"
> }
> ```
>
> `$1` 是脚本的第一个参数
>
> 

> [!tip]
>
> bash 使用了很多特殊的变量来表示参数、错误代码和相关变量。
>
> - `$0` - 脚本名
> - `$1` 到 `$9` - 脚本的参数。 `$1` 是第一个参数，依此类推。
> - `$@` - 所有参数
> - `$#` - 参数个数
> - `$?` - 前一个命令的返回值
> - `$$` - 当前脚本的进程识别码
> - `!!` - 完整的上一条命令，包括参数。常见应用：当你因为权限不足执行命令失败时，可以使用 `sudo !!` 再尝试一次。
> - `$_` - 上一条命令的最后一个参数。如果你正在使用的是交互式 shell，你可以通过按下 `Esc` 之后键入 . 来获取这个值。

## 输入输出

- 命令通常使用 `STDOUT` 来返回输出值，使用 `STDERR` 来返回错误及错误码，便于脚本以更加友好的方式报告错误。

  > **返回值 0 表示正常执行**，其他所有非 0 的返回值都表示有错误发生。
  >
  > 退出码可以搭配 `&&`（与操作符）和 `||`（或操作符）使用，用来进行条件判断，决定是否执行其他程序。
  >
  > 它们都属于短路 [运算符](https://en.wikipedia.org/wiki/Short-circuit_evaluation)（short-circuiting） 同一行的多个命令可以用 `;` 分隔。
  >
  > 程序 `true` 的返回码永远是 `0`，`false` 的返回码永远是 `1`。
  >
  > ```bash
  > false || echo "Oops, fail"
  > # Oops, fail
  > 
  > true || echo "Will not be printed"
  > #
  > 
  > true && echo "Things went well"
  > # Things went well
  > 
  > false && echo "Will not be printed"
  > #
  > 
  > false ; echo "This will always run"
  > # This will always run
  > ```

- 以变量的形式获取一个命令的输出，这可以通过 *命令替换*（*command substitution*）实现。

  > 通过 `$( CMD )` 这样的方式来执行 `CMD` 这个命令时，它的输出结果会替换掉 `$( CMD )` 
  >
  > 一个冷门的类似特性是 ***进程替换*（*process substitution*）**， `<( CMD )` 会执行 `CMD` 并将结果输出到一个临时文件中，并将 `<( CMD )` 替换成临时文件名。
  >
  > ```cpp
  > #!/bin/bash
  > 
  > echo "Starting program at $(date)" # date会被替换成日期和时间
  > 
  > echo "Running program $0 with $# arguments with pid $$"
  > 
  > for file in "$@"; do
  >     grep foobar "$file" > /dev/null 2> /dev/null
  >     # 如果模式没有找到，则grep退出状态为 1
  >     # 我们将标准输出流和标准错误流重定向到Null，因为我们并不关心这些信息
  >     if [[ $? -ne 0 ]]; then
  >         echo "File $file does not have any foobar, adding one"
  >         echo "# foobar" >> "$file"
  >     fi
  > done
  > ```
  >
  > 使用 `grep` 搜索字符串 `foobar`，如果没有找到，则将其作为注释追加到文件中。

### test命令

> [!important]
>
> Shell中的 test 命令用于检查某个条件是否成立，它可以进行数值、字符和文件三个方面的测试。

- 数值测试

  > 代码中的 [] 执行基本的算数运算
  > | 参数 | 说明           |
  > | :--- | :------------- |
  > | -eq  | 等于则为真     |
  > | -ne  | 不等于则为真   |
  > | -gt  | 大于则为真     |
  > | -ge  | 大于等于则为真 |
  > | -lt  | 小于则为真     |
  > | -le  | 小于等于则为真 |
  >
  > ```bash
  > num1=100
  > num2=100
  > if test $[num1] -eq $[num2]
  > then
  >     echo '两个数相等！'
  > else
  >     echo '两个数不相等！'
  > fi
  > 
  > #!/bin/bash
  > a=5
  > b=6
  > result=$[a+b] # 注意等号两边不能有空格
  > echo "result 为： $result"
  > ```

- 字符串测试

  > | =         | 等于则为真               |
  > | --------- | ------------------------ |
  > | !=        | 不相等则为真             |
  > | -z 字符串 | 字符串的长度为零则为真   |
  > | -n 字符串 | 字符串的长度不为零则为真 |
  >
  > ```bash
  > num1="ru1noob"
  > num2="runoob"
  > if test $num1 = $num2
  > then
  >     echo '两个字符串相等!'
  > else
  >     echo '两个字符串不相等!'
  > fi
  > ```

- 文件测试

  > | 参数      | 说明                                 |
  > | :-------- | :----------------------------------- |
  > | -e 文件名 | 如果文件存在则为真                   |
  > | -r 文件名 | 如果文件存在且可读则为真             |
  > | -w 文件名 | 如果文件存在且可写则为真             |
  > | -x 文件名 | 如果文件存在且可执行则为真           |
  > | -s 文件名 | 如果文件存在且至少有一个字符则为真   |
  > | -d 文件名 | 如果文件存在且为目录则为真           |
  > | -f 文件名 | 如果文件存在且为普通文件则为真       |
  > | -c 文件名 | 如果文件存在且为字符型特殊文件则为真 |
  > | -b 文件名 | 如果文件存在且为块特殊文件则为真     |
  >
  > ```bash
  > cd /bin
  > if test -e ./bash
  > then
  >     echo '文件已存在!'
  > else
  >     echo '文件不存在!'
  > fi
  > ```

- 其他

  > Shell 还提供了与( -a )、或( -o )、非( ! )三个逻辑操作符用于将测试条件连接起来，其优先级为： **!** 最高， **-a** 次之， **-o** 最低。
  >
  > ```bash
  > cd /bin
  > if test -e ./notFile -o -e ./bash
  > then
  >     echo '至少有一个文件存在!'
  > else
  >     echo '两个文件都不存在'
  > fi
  > ```

## Shell流程控制

### `if else·`

- if 语句语法格式：

  ```bash
  if condition
  then
      command1 
      command2
      ...
      commandN 
  fi
  ```

- if else 语法格式：

  ```bash
  if condition
  then
      command1 
      command2
      ...
      commandN
  else
      command
  fi
  ```

- if else-if else 语法格式：

  ```bash
  if condition1
  then
      command1
  elif condition2 
  then 
      command2
  else
      commandN
  fi
  ```

> [!tip]
>
>  **[...]** 判断语句中大于使用 **-gt**，小于使用 **-lt**。
>
>  **((...))** 作为判断语句，大于和小于可以直接使用 **>** 和 **<**。

### for循环

for循环一般格式为：

```bash
for var in item1 item2 ... itemN
do
    command1
    command2
    ...
    commandN
done
```

> [!tip]
>
> in 列表可以包含替换、字符串和文件名。
>
> in列表是可选的，如果不用它，for循环使用命令行的位置参数。

### `while`循环

while 循环用于不断执行一系列命令，也用于从输入文件中读取数据。其语法格式为：

```bash
while condition
do
    command
done
```

> [!tip]
>
> while循环可用于读取键盘信息。下面的例子中，输入信息被设置为变量FILM，按<Ctrl-D>结束循环。
>
> ```bash
> echo '按下 <CTRL-D> 退出'
> echo -n '输入你最喜欢的网站名: '
> while read FILM
> do
>     echo "是的！$FILM 是一个好网站"
> done
> ```

- ### 无限循环

  无限循环语法格式：

  ```bash
  while :
  do
      command
  done
  ```

  或者

  ```bash
  while true
  do
      command
  done
  ```

  或者

  ```bash
  for (( ; ; ))
  ```

### until循环

until 循环执行一系列命令直至条件为 true 时停止。

until 语法格式:

```bash
until condition
do
    command
done
```

### case ... esac

**case ... esac** 为多选择语句，

每个 case 分支用右圆括号开始，用两个分号 **;;** 表示 break，即执行结束，跳出整个 case ... esac 语句，esac（就是 case 反过来）作为结束标记。

**case ... esac** 语法格式如下：

```bash
case 值 in
模式1)
    command1
    command2
    ...
    commandN
    ;;
模式2)
    command1
    command2
    ...
    commandN
    ;;
esac
```

### 跳出循环

1. ### break 命令

   > break 命令允许跳出所有循环（终止执行后面的所有循环）。

2. ### continue

   continue 命令与 break 命令类似，只有一点差别，它不会跳出所有循环，仅仅跳出当前循环。

---

## Shell通配符

> [!note]
>
> 1. 通配符 - 当你想要利用通配符进行匹配时，你可以分别使用 `?` 和 `*` 来匹配一个或任意个字符。
>
>    例如，对于文件 `foo`, `foo1`, `foo2`, `foo10` 和 `bar`, `rm foo?` 这条命令会删除 `foo1` 和 `foo2` ，而 `rm foo*` 则会删除除了 `bar` 之外的所有文件。
>
> 2. 花括号 `{}` - 当你有一系列的指令，其中包含一段公共子串时，可以用花括号来自动展开这些命令。这在批量移动或转换文件时非常方便。
>
> ```bash
> convert image.{png,jpg}
> # 会展开为
> convert image.png image.jpg
> 
> cp /path/to/project/{foo,bar,baz}.sh /newpath
> # 会展开为
> cp /path/to/project/foo.sh /path/to/project/bar.sh /path/to/project/baz.sh /newpath
> 
> # 也可以结合通配使用
> mv *{.py,.sh} folder
> # 会移动所有 *.py 和 *.sh 文件
> 
> mkdir foo bar
> 
> # 下面命令会创建 foo/a, foo/b, ... foo/h, bar/a, bar/b, ... bar/h 这些文件
> touch {foo,bar}/{a..h}
> touch foo/x bar/y
> # 比较文件夹 foo 和 bar 中包含文件的不同
> diff <(ls foo) <(ls bar)
> # 输出
> # < x
> # ---
> # > y
> ```

## `shebang(#!)`

> 在Shebang之后，可以有一个或数个空白字符，后接解释器的绝对路径，用于指明执行这个脚本文件的解释器。
>
> 在 `shebang` 行中使用 [`env`](https://man7.org/linux/man-pages/man1/env.1.html) 命令是一种好的实践，它会利用环境变量中的程序来解析该脚本，这样就提高了您的脚本的可移植性。

---

## Shell特点

> [!note]
>
> - 函数只能与 shell 使用相同的语言，脚本可以使用任意语言。因此在脚本中包含 `shebang` 是很重要的。
> - 函数仅在定义时被加载，脚本会在每次被执行时加载。这让函数的加载比脚本略快一些，但每次修改函数定义，都要重新加载一次。
> - 函数会在当前的 shell 环境中执行，脚本会在单独的进程中执行。因此，函数可以对环境变量进行更改，比如改变当前工作目录，脚本则不行。脚本需要使用 [`export`](https://man7.org/linux/man-pages/man1/export.1p.html) 将环境变量导出，并将值传递给环境变量。
> - 与其他程序语言一样，函数可以提高代码模块性、代码复用性并创建清晰性的结构。shell 脚本中往往也会包含它们自己的函数定义。

---

## Shell工具

### 查看命令如何使用

1. 最常用的方法是为对应的命令行添加 `-h` 或 `--help` 标记。
2. 另外一个更详细的方法则是使用 `man` 命令。[`man`](https://man7.org/linux/man-pages/man1/man.1.html) 命令是手册（manual）的缩写，它提供了命令的用户手册。
3.  [TLDR pages](https://tldr.sh/) （`tldr`命令）

### 查找文件

1. `find` 命令会递归地搜索符合条件的文件，例如：

   ```bash
   # 查找所有名称为src的文件夹
   find . -name src -type d
   # 查找所有文件夹路径中包含test的python文件
   find . -path '*/test/*.py' -type f
   # 查找前一天修改的所有文件
   find . -mtime -1
   # 查找所有大小在500k至10M的tar.gz文件
   find . -size +500k -size -10M -name '*.tar.gz'
   ```

   > [!tip]
   >
   > find 还能对所有查找到的文件进行操作。这能极大地简化一些单调的任务。
   >
   > ```bash
   > # 删除全部扩展名为.tmp 的文件
   > find . -name '*.tmp' -exec rm {} \;
   > # 查找全部的 PNG 文件并将其转换为 JPG
   > find . -name '*.png' -exec convert {} {}.jpg \;
   > ```

2. [`fd`](https://github.com/sharkdp/fd) 就是一个更简单、更快速、更友好的程序，它可以用来作为 `find` 的替代品。

3. `locate` 使用一个由 [`updatedb`](https://man7.org/linux/man-pages/man1/updatedb.1.html) 负责更新的数据库，在大多数系统中 `updatedb` 都会通过 [`cron`](https://man7.org/linux/man-pages/man8/cron.8.html) 每日更新

---

### 查找代码

1.  [`grep`](https://man7.org/linux/man-pages/man1/grep.1.html) 命令，它是用于对输入文本进行匹配的通用工具。

   > `grep` 有很多选项
   >
   >  `-C` ：获取查找结果的上下文（Context）；
   >
   > `-v` 将对结果进行反选（Invert），也就是输出不匹配的结果。 
   >
   > `grep -C 5` 会输出匹配结果前后五行。
   >
   >  `-R` 会递归地进入子目录并搜索所有的文本文件。

### 查找 shell 命令

1. `history` 命令允许您以程序员的方式来访问 shell 中输入的历史命令。

   > 利用管道将输出结果传递给 `grep` 进行模式搜索。 `history | grep find` 会打印包含 find 子串的命令。

2. 使用 `Ctrl+R` 对命令历史记录进行回溯搜索。敲 `Ctrl+R` 后您可以输入子串来进行匹配，查找历史命令行。

3. 使用方向键上或下也可以完成这项工作。

4. `Ctrl+R` 可以配合 [fzf](https://github.com/junegunn/fzf/wiki/Configuring-shell-key-bindings#ctrl-r) 使用。`fzf` 是一个通用的模糊查找工具

### 文件夹导航

使用 [`fasd`](https://github.com/clvv/fasd) 和 [autojump](https://github.com/wting/autojump) 这两个工具来查找最常用或最近使用的文件和目录。

---

## 习题

1. 阅读 [`man ls`](https://man7.org/linux/man-pages/man1/ls.1.html) ，然后使用 `ls` 命令进行如下操作：

   - 所有文件（包括隐藏文件）
   - 文件打印以人类可以理解的格式输出 (例如，使用 454M 而不是 454279954)
   - 文件以最近访问顺序排序
   - 以彩色文本显示输出结果

   典型输出如下：

   ```bash
    -rw-r--r--   1 user group 1.1M Jan 14 09:53 baz
    drwxr-xr-x   5 user group  160 Jan 14 09:53 .
    -rw-r--r--   1 user group  514 Jan 14 06:42 bar
    -rw-r--r--   1 user group 106M Jan 13 12:12 foo
    drwx------+ 47 user group 1.5K Jan 12 18:08 ..
    
    //ans
    ls -a -l -h -t --color=auto
   ```

2. 编写两个 bash 函数 `marco` 和 `polo` 执行下面的操作。 每当你执行 `marco` 时，当前的工作目录应当以某种形式保存，当执行 `polo` 时，无论现在处在什么目录下，都应当 `cd` 回到当时执行 `marco` 的目录。 为了方便 debug，你可以把代码写在单独的文件 `marco.sh` 中，并通过 `source marco.sh` 命令，（重新）加载函数。

   ```bash
    #!/bin/bash
    marco() {
        export MARCO=$(pwd)
    }
    polo() {
        cd "$MARCO"
    }
   ```

3. 假设您有一个命令，它很少出错。因此为了在出错时能够对其进行调试，需要花费大量的时间重现错误并捕获输出。 编写一段 bash 脚本，运行如下的脚本直到它出错，将它的标准输出和标准错误流记录到文件，并在最后输出所有内容。 加分项：报告脚本在失败前共运行了多少次。

   ```bash
    #!/usr/bin/env bash
   
    n=$(( RANDOM % 100 ))
   
    if [[ n -eq 42 ]]; then
       echo "Something went wrong"
       >&2 echo "The error was using magic numbers"
       exit 1
    fi
   
    echo "Everything went according to plan"
    
    #ans
     #!/usr/bin/env bash
    count=0
    echo > out.log
   
    while true
    do
        ./buggy &>> out.log
        if [[ $? -ne 0 ]]; then
            cat out.log
            echo "failed after $count times"
            break
        fi
        ((count++))
   
    done
   ```

   

4. 本节课我们讲解的 `find` 命令中的 `-exec` 参数非常强大，它可以对我们查找的文件进行操作。但是，如果我们要对所有文件进行操作呢？例如创建一个 zip 压缩文件？我们已经知道，命令行可以从参数或标准输入接受输入。在用管道连接命令时，我们将标准输出和标准输入连接起来，但是有些命令，例如 `tar` 则需要从参数接受输入。这里我们可以使用 [`xargs`](https://man7.org/linux/man-pages/man1/xargs.1.html) 命令，它可以使用标准输入中的内容作为参数。 例如 `ls | xargs rm` 会删除当前目录中的所有文件。

   您的任务是编写一个命令，它可以递归地查找文件夹中所有的 HTML 文件，并将它们压缩成 zip 文件。注意，即使文件名中包含空格，您的命令也应该能够正确执行（提示：查看 `xargs` 的参数 `-d`，译注：MacOS 上的 `xargs` 没有 `-d`，[查看这个 issue](https://github.com/missing-semester/missing-semester/issues/93)）

   如果您使用的是 MacOS，请注意默认的 BSD `find` 与 [GNU coreutils](https://en.wikipedia.org/wiki/List_of_GNU_Core_Utilities_commands) 中的是不一样的。你可以为 `find` 添加 `-print0` 选项，并为 `xargs` 添加 `-0` 选项。作为 Mac 用户，您需要注意 mac 系统自带的命令行工具和 GNU 中对应的工具是有区别的；如果你想使用 GNU 版本的工具，也可以使用 [brew 来安装](https://formulae.brew.sh/formula/coreutils)。

   ```bash
   find . -type f -name "*.html" -print0 | xargs -d tar -cvzf html.zip
   ```

   

5. （进阶）编写一个命令或脚本递归的查找文件夹中最近使用的文件。更通用的做法，你可以按照最近的使用时间列出文件吗？

   ```bash
   find . -type f -mmin -60 -print0 | xargs -0 ls -lt | head -10
   ```

   
