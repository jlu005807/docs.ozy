# 元编程

- 学习构建系统、代码测试以及依赖管理
- “元编程” 也有 “[用于操作程序的程序](https://en.wikipedia.org/wiki/Metaprogramming)” 之含义

## 构建系统

- 对于大多数系统来说，不论其是否包含代码，都会包含一个 “构建过程”。通常，这一过程包含了很多步骤，很多分支。执行一些命令来生成图表，然后执行另外的一些命令生成结果，然后再执行其他的命令来生成最终的论文。
- 有很多工具可以帮助我们完成这些操作。这些工具通常被称为 “构建系统”

> [!note]
>
> 如何选择工具完全取决于您当前手头上要完成的任务以及项目的规模。
>
> 需要定义 *依赖*、*目标* 和 *规则*。您必须告诉构建系统您具体的构建目标，系统的任务则是找到构建这些目标所需要的依赖，并根据规则构建所需的中间产物，直到最终目标被构建出来。
>
> 理想的情况下，如果目标的依赖没有发生改动，并且我们可以从之前的构建中复用这些依赖，那么与其相关的构建规则并不会被执行。

### `make`

`make` 是最常用的构建系统之一，您会发现它通常被安装到了几乎所有基于 UNIX 的系统中。

执行 `make` 时，它会去参考当前目录下名为 `Makefile` 的文件。所有构建目标、相关依赖和规则都需要在该文件中定义，它看上去是这样的：

```makefile
paper.pdf: paper.tex plot-data.png
	pdflatex paper.tex

plot-%.png: %.dat plot.py
	./plot.py -i $*.dat -o $@
```

- 这个文件中的指令，即如何使用右侧文件构建左侧文件的规则。
- 冒号左侧的是构建目标，冒号右侧的是构建它所需的依赖。缩进的部分是从依赖构建目标时需要用到的一段命令。
- 在 `make` 中，第一条指令还指明了构建的目的，如果您使用不带参数的 `make`，这便是我们最终的构建结果。

> [!tip]
>
> 规则中的 `%` 是一种模式，它会匹配其左右两侧相同的字符串。
>
> 例如，如果目标是 `plot-foo.png`， `make` 会去寻找 `foo.dat` 和 `plot.py` 作为依赖。



## 依赖管理

就您的项目来说，它的依赖可能本身也是其他的项目。

项目会依赖某些程序（例如 `python`）、系统包（例如 `openssl`）或相关编程语言的库（例如 `matplotlib`）。 现在，大多数的依赖可以通过某些 **软件仓库** 来获取，这些仓库会在一个地方托管大量的依赖，我们则可以通过一套非常简单的机制来安装依赖

> Ubuntu 系统下面有 Ubuntu 软件包仓库，您可以通过 `apt` 这个工具来访问， RubyGems 则包含了 Ruby 的相关库，PyPi 包含了 Python 库， Arch Linux 用户贡献的库则可以在 Arch User Repository 中找到。

### 版本控制

- 大多数被其他项目所依赖的项目都会在每次发布新版本时创建一个 *版本号*。
- 版本号有很多用途，其中最重要的作用是保证软件能够运行
- 版本控制可以指定当前**项目需要基于某个版本**，甚至某个范围内的版本，或是某些项目来构建。这么做的话，即使某个被依赖的库发生了变化，依赖它的软件可以基于其之前的版本进行构建

> [!note]
>
> 一个相对比较常用的标准是 [语义版本号](https://semver.org/)，这种版本号具有不同的语义，它的格式是这样的：**主版本号.次版本号.补丁号**。相关规则有：
>
> - 如果新的版本没有改变 API，请将补丁号递增；
> - 如果您添加了 API 并且该改动是向后兼容的，请将次版本号递增；
> - 如果您修改了 API 但是它并不向后兼容，请将主版本号递增。
>
> 如果我们的项目是基于您的项目构建的，那么只要最新版本的主版本号只要没变就是安全的 ，次版本号不低于之前我们使用的版本即可。
>
> 例如，Python 2 和 Python 3 的代码是不兼容的

- 依赖管理系统的时候，您可能会遇到锁文件（*lock files*）

  > 锁文件列出了您当前每个依赖所对应的具体版本号。通常，您需要执行升级程序才能更新依赖的版本。

- 一种极端的依赖锁定叫做 *vendoring*

  > - 它会把您的依赖中的所有代码直接拷贝到您的项目中，这样您就能够完全掌控代码的任何修改，同时您也可以将自己的修改添加进去，不过这也意味着如果该依赖的维护者更新了某些代码，您也必须要自己去拉取这些更新。

## 持续集成系统

持续集成（Continuous integration），或者叫做 CI 是一种雨伞术语（umbrella term，涵盖了一组术语的术语），它指的是那些“当您的代码变动时，自动运行的东西”

您需要在代码仓库中添加一个文件，描述当前仓库发生任何修改时，应该如何应对。目前为止，最常见的规则是：如果有人提交代码，执行测试套件。

当这个事件被触发时，CI 提供方会启动一个（或多个）虚拟机，**执行您制定的规则**，并且通常会记录下相关的执行结果。

## 测试简介

多数的大型软件都有“测试套件”。您可能已经对测试的相关概念有所了解，但是我们觉得有些测试方法和测试术语还是应该再次提醒一下：

- 测试套件（Test suite）：所有测试的统称。
- 单元测试（Unit test）：一种“微型测试”，用于对某个封装的特性进行测试。
- 集成测试（Integration test）：一种“宏观测试”，针对系统的某一大部分进行，测试其不同的特性或组件是否能 *协同* 工作。
- 回归测试（Regression test）：一种实现特定模式的测试，用于保证之前引起问题的 bug 不会再次出现。
- 模拟（Mocking）: 使用一个假的实现来替换函数、模块或类型，屏蔽那些和测试不相关的内容。例如，您可能会“模拟网络连接” 或 “模拟硬盘”。

# 课后练习

[习题解答](https://missing-semester-cn.github.io/missing-notes-and-solutions/2020/solutions//metaprogramming-solution)

1. 大多数的 makefiles 都提供了 一个名为 `clean` 的构建目标，这并不是说我们会生成一个名为 `clean` 的文件，而是我们可以使用它清理文件，让 make 重新构建。您可以理解为它的作用是“撤销”所有构建步骤。在上面的 makefile 中为 `paper.pdf` 实现一个 `clean` 目标。您需要将构建目标设置为 [phony](https://www.gnu.org/software/make/manual/html_node/Phony-Targets.html)。您也许会发现 [`git ls-files`](https://git-scm.com/docs/git-ls-files) 子命令很有用。其他一些有用的 make 构建目标可以在 [这里](https://www.gnu.org/software/make/manual/html_node/Standard-Targets.html#Standard-Targets) 找到；
2. 指定版本要求的方法很多，让我们学习一下 [Rust 的构建系统](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html) 的依赖管理。大多数的包管理仓库都支持类似的语法。对于每种语法(尖号、波浪号、通配符、比较、多个版本要求)，构建一种场景使其具有实际意义；
3. Git 可以作为一个简单的 CI 系统来使用，在任何 git 仓库中的 `.git/hooks` 目录中，您可以找到一些文件（当前处于未激活状态），它们的作用和脚本一样，当某些事件发生时便可以自动执行。请编写一个 [`pre-commit`](https://git-scm.com/docs/githooks#_pre_commit) 钩子，它会在提交前执行 `make paper.pdf` 并在出现构建失败的情况拒绝您的提交。这样做可以避免产生包含不可构建版本的提交信息；
4. 基于 [GitHub Pages](https://pages.github.com/) 创建任意一个可以自动发布的页面。添加一个 [GitHub Action](https://github.com/features/actions) 到该仓库，对仓库中的所有 shell 文件执行 `shellcheck`([方法之一](https://github.com/marketplace/actions/shellcheck))；
5. [构建属于您的](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/building-actions) GitHub action，对仓库中所有的 `.md` 文件执行 [`proselint`](http://proselint.com/) 或 [`write-good`](https://github.com/btford/write-good)，在您的仓库中开启这一功能，提交一个包含错误的文件看看该功能是否生效。



