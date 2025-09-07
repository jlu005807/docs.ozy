# 版本控制（Git）

## 版本控制系统

版本控制系统 (VCSs) 是一类用于**追踪源代码（或其他文件、文件夹）改动**的工具。

> - 管理代码的修改历史
> - 让协作编码变得更方便
> - VCS 通过一系列的**快照**将某个文件夹及其内容保存了起来，每个快照都包含了顶级目录中所有的文件或文件夹的**完整状态**。
> - 还维护了快照创建者的信息以及每个快照的相关信息

## Git的数据模型

通过一种自底向上的方式向您介绍 Git。我们会从数据模型开始，最后再学习它的接口。

Git 拥有一个经过精心设计的模型，这使其能够支持版本控制所需的所有特性，例如**维护历史记录、支持分支和促进协作**。

### 快照

- Git 将**顶级目录中的文件和文件夹作为集合**，并通过一系列快照来管理其历史记录。

  > - 在 Git 的术语里，文件被称作 **Blob 对象（数据对象）**，也就是一组数据。
  > - 目录则被称之为“树”，它将名字与 Blob 对象或树对象进行**映射**（使得目录中可以包含其他目录）
  > - 快照则是**被追踪的最顶层的树**
  >
  > ```text
  > <root> (tree)
  > |
  > +- foo (tree)
  > |  |
  > |  + bar.txt (blob, contents = "hello world")
  > |
  > +- baz.txt (blob, contents = "git is wonderful")
  > ```
  >
  > 顶层的树包含了两个元素，一个名为 **“foo” 的树**（它本身包含了一个 blob 对象 “bar.txt”），以及一个 **blob 对象 “baz.txt”**

## 历史记录建模：关联快照

在 Git 中，历史记录是一个由快照组成的**有向无环图**

> 这代表 Git 中的每个快照都有一系列的“父辈”，也就是**其之前**的一系列快照。注意，快照具有多个“父辈”而非一个，因为某个快照可能由多个父辈而来。
>
> 在 Git 中，这些快照被称为“提交”。
>
> ```text
> o <-- o <-- o <-- o
>             ^
>              \
>               --- o <-- o
> ```
>
> 箭头指向了当前提交的**父辈**（这是一种“在…之前”，而不是“在…之后”的关系）
>
> 第三次提交之后，历史记录分岔成了两条独立的分支。开发完成后，这些分支可能会被合并并创建一个新的提交，这个新的提交会同时包含这些特性。新的提交会创建一个新的历史记录：
>
> ```
> o <-- o <-- o <-- o <----  o 
>             ^            /
>              \          v
>               --- o <-- o
> ```

Git 中的提交是不可改变的，“修改”实际上是**创建了一个全新的提交记录**。引用（参见下文）则被更新为指向这些新的提交。

## 数据模型及其伪代码表示

```
// 文件就是一组数据
type blob = array<byte>

// 一个包含文件和目录的目录
type tree = map<string, tree | blob>

// 每个提交都包含一个父辈，元数据和顶层树
type commit = struct {
    parents: array<commit>
    author: string
    message: string
    snapshot: tree
}
```

这是一种简洁的历史模型。

## 对象和内存寻址

Git 中的对象可以是 blob、树或提交：

```
type object = blob | tree | commit
```

Git 在储存数据时，所有的对象都会基于它们的 [SHA-1 哈希](https://en.wikipedia.org/wiki/SHA-1) 进行**寻址**。

```python
objects = map<string, object>

def store(object):
    id = sha1(object)
    objects[id] = object

def load(id):
    return objects[id]
```

Blobs、树和提交都一样，它们都是对象。硬盘上仅仅保存了它们的哈希值作为**引用**。

> [!tip]
>
> 通过 `git cat-file -p 698281bc680d1995c5f4caaf3359721a5a58d48d` 来进行可视化），看上去是这样的：
>
> ```
> 100644 blob 4448adbf7ecd394f42ae135bbeed9676e894af85    baz.txt
> 040000 tree c68d233a33c5c06e0340e4c224f0afca87c8ce87    foo
> ```
>
> `git cat-file -p 4448adbf7ecd394f42ae135bbeed9676e894af85`，即通过哈希值查看 baz.txt 的内容

### 引用

Git 的解决方法是给这些**哈希值赋予人类可读的名字**，也就是引用（references）

> - 引用是**指向提交的指针**。与对象不同的是，它是可变的（引用可以被更新，指向新的提交）
> - `master` 引用通常会指向主分支的最新一次提交。
>
> ```python
> references = map<string, string>
> 
> def update_reference(name, id):
>     references[name] = id
> 
> def read_reference(name):
>     return references[name]
> 
> def load_reference(name_or_id):
>     if name_or_id in references:
>         return load(references[name_or_id])
>     else:
>         return load(name_or_id)
> ```
>
> 通常情况下，我们会想要知道“我们当前所在位置”，并将其标记下来。这样当我们创建新的快照的时候，我们就可以知道它的相对位置（如何设置它的“父辈”）。在 Git 中，我们**当前的位置**有一个**特殊的索引，它就是 “HEAD”**。

---

### 仓库

粗略地给出 Git 仓库的定义了：`对象` 和 `引用`。

Git 仅存储对象和引用：因为其数据模型仅包含这些东西。

`git` 命令都对应着对提交树的操作，例如增加对象，增加或删除引用

### 暂存区

暂存区：Git 中还包括一个和数据模型完全不相关的概念，但它确是**创建提交的接口的一部分**。

使用一种叫做 “暂存区（staging area）”的机制，它允许您指定**下次快照中要包括那些改动**。

> 1. 希望创建两个独立的提交，其中第一个提交仅包含第一个特性，而第二个提交仅包含第二个特性
> 2. 设您在调试代码时添加了很多打印语句，然后您仅仅希望提交和修复 bug 相关的代码而丢弃所有的打印语句。

---

## Git的命令行接口

### 基础

- s`git help <command>`: 获取 git 命令的帮助信息

- `git init`: 创建一个新的 git 仓库，其数据会存放在一个名为 `.git` 的目录下

- `git status`: 显示当前的仓库状态

- `git add <filename>`: 添加文件到暂存区

- ```plaintext
  git commit
  ```

  : 创建一个新的提交

  - 如何编写 [良好的提交信息](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)!
  - 为何要 [编写良好的提交信息](https://chris.beams.io/posts/git-commit/)

  > 

- `git log`: 显示历史日志

- `git log --all --graph --decorate`: 可视化历史记录（有向无环图）

- `git diff <filename>`: 显示与暂存区文件的差异

- `git diff <revision> <filename>`: 显示某个文件两个版本之间的差异

- `git checkout <revision>`: 更新 HEAD 和目前的分支

### 分支和合并

- `git branch`: 显示分支

- `git branch <name>`: 创建分支

- ```plaintext
  git checkout -b <name>
  ```

  : 创建分支并切换到该分支

  - 相当于 `git branch <name>; git checkout <name>`

- `git merge <revision>`: 合并到当前分支

- `git mergetool`: 使用工具来处理合并冲突

- `git rebase`: 将一系列补丁变基（rebase）为新的基线

### 远端操作

- `git remote`: 列出远端
- `git remote add <name> <url>`: 添加一个远端
- `git push <remote> <local branch>:<remote branch>`: 将对象传送至远端并更新远端引用
- `git branch --set-upstream-to=<remote>/<remote branch>`: 创建本地和远端分支的关联关系
- `git fetch`: 从远端获取对象/索引
- `git pull`: 相当于 `git fetch; git merge`
- `git clone`: 从远端下载仓库

### 撤销

- `git commit --amend`: 编辑提交的内容或信息
- `git reset HEAD <file>`: 恢复暂存的文件
- `git checkout -- <file>`: 丢弃修改
- `git restore`: git2.32 版本后取代 git reset 进行许多撤销操作

### Git 高级操作

- `git config`: Git 是一个 [高度可定制的](https://git-scm.com/docs/git-config) 工具
- `git clone --depth=1`: 浅克隆（shallow clone），不包括完整的版本历史信息
- `git add -p`: 交互式暂存
- `git rebase -i`: 交互式变基
- `git blame`: 查看最后修改某行的人
- `git stash`: 暂时移除工作目录下的修改内容
- `git bisect`: 通过二分查找搜索历史记录
- `.gitignore`: [指定](https://git-scm.com/docs/gitignore) 故意不追踪的文件