[TOC]

# **CHAPTER 6 Lambda Expressions**

## **`Lambda`**

> [!important]
>
> - *lambda*表达式是C++编程中的游戏规则改变者。
> - *lambda*是**创建函数对象**相当便捷的一种方法
>
> 1. STL中的“`_if`”算法（比如，`std::find_if`，`std::remove_if`，`std::count_if`等）通常需要繁琐的**谓词**可以通过lambda实现
> 2. 用**比较函数**（比如，`std::sort`，`std::nth_element`，`std::lower_bound`等）来自定义算法也是同样方便的。
> 3. 在STL外，*lambda*可以快速创建`std::unique_ptr`和`std::shared_ptr`的**自定义删除器**（见[Item18](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item18.html)和[19](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item19.html)）
> 4. 线程API中**条件变量的谓词**指定变得同样简单
> 5. 除了标准库，*lambda*有利于即时的**回调函数**，接口适配函数和特定上下文中的**一次性函数**。

- ***lambda\*表达式**（*lambda expression*）就是一个表达式。

  ```cpp
  std::find_if(container.begin(), container.end(),
               [](int val){ return 0 < val && val < 10; });   //译者注：本行高亮就是*lambda*
  ```

- **闭包**（*enclosure*）是*lambda*创建的**运行时对象**。依赖捕获模式，闭包持有被捕获数据的副本或者引用。在上面的`std::find_if`调用中，闭包是作为第三个实参在运行时传递给`std::find_if`的对象。

- **闭包类**（*closure class*）是从中**实例化闭包的类**。每个*lambda*都会使编译器生成唯一的闭包类。*lambda*中的语句成为其闭包类的**成员函数中的可执行指令**。

- *lambda*通常被用来**创建闭包**，该闭包仅用作函数的实参。

  > ```cpp
  > {
  >     int x;                                  //x是局部对象
  >     auto c1 =                               //c1是lambda产生的闭包的副本
  >         [x](int y) { return x * y > 55; };
  >     auto c2 = c1;                           //c2是c1的拷贝
  >     auto c3 = c2;                           //c3是c2的拷贝
  > }
  > ```
  >
  > **闭包通常可以拷贝**，所以可能有多个闭包对应于一个*lambda*

- > [!tip]
  >
  > 非正式的讲，模糊*lambda*，闭包和闭包类之间的界限是可以接受的。但是，在随后的Item中，区分什么存在于**编译期（*lambdas* 和闭包类）**，什么存在于**运行时（闭包）**以及它们之间的相互关系是重要的。

---

## **Item 31: Avoid default capture modes**

> [!important]
>
> C++11中有两种默认的捕获模式：**按引用捕获和按值捕获**。
>
> 默认按引用捕获模式可能会带来**悬空引用**的问题

### 引用捕获

按引用捕获会导致闭包中包含了对某个局部变量或者形参的引用，变量或形参只在定义*lambda*的**作用域**中可用。

该*lambda*创建的闭包生命周期超过了局部变量或者形参的生命周期，那么闭包中的引用将会变成悬空引用。

> 元素是**过滤函数**（filtering function）的一个容器，该函数接受一个`int`，并返回一个`bool`，该`bool`的结果表示传入的值是否满足过滤条件：
>
> ```cpp
> using FilterContainer =                     //“using”参见条款9，
>     std::vector<std::function<bool(int)>>;  //std::function参见条款2
> 
> FilterContainer filters;                    //过滤函数
> 
> //添加一个过滤器，用来过滤掉5的倍数：
> filters.emplace_back(                       //emplace_back的信息见条款42
>     [](int value) { return value % 5 == 0; }
> );
> ```
>
> 需要的是能够在**运行期**计算除数（divisor），即不能将5硬编码到*lambda*中。
>
> ```cpp
> void addDivisorFilter()
> {
>     auto calc1 = computeSomeValue1();
>     auto calc2 = computeSomeValue2();
> 
>     auto divisor = computeDivisor(calc1, calc2);
> 
>     filters.emplace_back(                               //危险！对divisor的引用
>         [&](int value) { return value % divisor == 0; } //将会悬空！
>     );
> }
> 
> //同样显式按引用捕获也一样
> filters.emplace_back(
>     [&divisor](int value) 			    //危险！对divisor的引用将会悬空！
>     { return value % divisor == 0; }
> );
> ```
>
> *lambda*对局部变量`divisor`进行了引用，但该变量的生命周期会在`addDivisorFilter`返回时结束，因此添加到`filters`的函数添加完，该函数就会导致未定义行为。
>
> 通过显式的捕获，能更容易看到*lambda*的可行性**依赖**于变量`divisor`的生命周期。比起“`[&]`”传达的意思，显式捕获能让人更容易想起“确保没有悬空变量”。

- 一个闭包将会被马上使用（例如被传入到一个STL算法中）并且不会被拷贝

  > 例如，我们的过滤*lambda*只会用做C++11中`std::all_of`的一个实参，返回满足条件的所有元素：
  >
  > ```cpp
  > template<typename C>
  > void workWithContainer(const C& container)
  > {
  >     auto calc1 = computeSomeValue1();               //同上
  >     auto calc2 = computeSomeValue2();               //同上
  >     auto divisor = computeDivisor(calc1, calc2);    //同上
  > 
  >     using ContElemT = typename C::value_type;       //容器内元素的类型
  >     using std::begin;                               //为了泛型，见条款13
  >     using std::end;
  > 
  >     if (std::all_of(                                //如果容器内所有值都为
  >             begin(container), end(container),       //除数的倍数
  >             [&](const ContElemT& value)
  >             { return value % divisor == 0; })
  >         ) {
  >         …                                           //它们...
  >     } else {
  >         …                                           //至少有一个不是的话...
  >     }
  > }
  > ```
  >
  > 是安全的做法，但这种安全是**不确定**的
  >
  > 发现*lambda*在其它上下文中很有用（例如作为一个函数被添加在`filters`容器中），然后拷贝粘贴到一个`divisor`变量已经死亡，但闭包生命周期还没结束的上下文中，又会**悬空使用**

- 从长期来看，**显式列出*lambda*依赖的局部变量和形参**，是更加符合软件工程规范的做法。

> [!tip]
>
> C++14支持了在*lambda*中使用`auto`来声明变量
>
> ```cpp
> if (std::all_of(begin(container), end(container),
>                [&](const auto& value)               // C++14
>                { return value % divisor == 0; }))			
> ```

---

### 按值捕获

一个解决问题的方法是，`divisor`默认按值捕获进去，也就是说可以按照以下方式来添加*lambda*到`filters`：

```cpp
filters.emplace_back( 							    //现在divisor不会悬空了
    [=](int value) { return value % divisor == 0; }
);
```

- 在通常情况下，按值捕获并不能完全解决悬空引用的问题。

  > 如果你按值捕获的是一个**指针**，你将该指针拷贝到*lambda*对应的闭包里，但这样并不能避免*lambda*外`delete`这个指针的行为，从而导致你的副本指针变成悬空指针。

- 在一个`Widget`类，可以实现向过滤器的容器添加条目：

  > ```cpp
  > class Widget {
  > public:
  >     …                       //构造函数等
  >     void addFilter() const; //向filters添加条目
  > private:
  >     int divisor;            //在Widget的过滤器使用
  > };
  > 
  > void Widget::addFilter() const
  > {
  >     filters.emplace_back(
  >         [=](int value) { return value % divisor == 0; }
  >     );
  > }	
  > ```
  >
  > > [!warning]
  > >
  > > 捕获只能应用于*lambda***被创建时所在作用域**里的**non-`static`局部变量**（包括形参）。
  > >
  > > `Widget::addFilter`的视线里，`divisor`并不是一个局部变量，而是`Widget`类的一个成员变量，**不能被捕获**。
  >
  > 显式地捕获`divisor`变量（或者按引用或者按值），也一样会编译失败
  >
  > ```cpp
  > void Widget::addFilter() const
  > {
  >     filters.emplace_back(
  >         [divisor](int value)                //错误！没有名为divisor局部变量可捕获
  >         { return value % divisor == 0; }
  >     );
  > }
  > ```

  - 解释就是这里隐式使用了一个**原始指针**：`this`。

  > 每一个**non-`static`成员函数都有一个`this`指针**，每次你使用一个类内的数据成员时都会使用到这个指针。
  >
  > 在任何`Widget`成员函数中，编译器会在内部将`divisor`替换成**`this->divisor`**
  >
  > ```cpp
  > void Widget::addFilter() const
  > {
  >     auto currentObjectPtr = this;
  > 
  >     filters.emplace_back(
  >         [currentObjectPtr](int value)
  >         { return value % currentObjectPtr->divisor == 0; }
  >     );
  > }
  > ```
  >
  > 真正被捕获的是`Widget`的`this`指针，而不是`divisor`

> [!note]
>
> *lambda*闭包的生命周期与`Widget`对象的关系，闭包内含有`Widget`的**`this`指针的拷贝**。

> ```cpp
> using FilterContainer = 					//跟之前一样
>     std::vector<std::function<bool(int)>>;
> 
> FilterContainer filters;                    //跟之前一样
> 
> void doSomeWork()
> {
>     auto pw =                               //创建Widget；std::make_unique
>         std::make_unique<Widget>();         //见条款21
> 
>     pw->addFilter();                        //添加使用Widget::divisor的过滤器
> }                                           //销毁Widget；filters现在持有悬空指针！
> ```

- 问题可以通过给你想捕获的数据成员做一个**局部副本**，然后捕获这个副本去解决：

  > ```cpp
  > void Widget::addFilter() const
  > {
  >     auto divisorCopy = divisor;                 //拷贝数据成员
  > 
  >     filters.emplace_back(
  >         [divisorCopy](int value)                //捕获副本
  >         { return value % divisorCopy == 0; }	//使用副本
  >     );
  > }
  > //采用这种方法，默认的按值捕获也是可行的。
  > void Widget::addFilter() const
  > {
  >     auto divisorCopy = divisor;                 //拷贝数据成员
  > 
  >     filters.emplace_back(
  >         [=](int value)                          //捕获副本
  >         { return value % divisorCopy == 0; }	//使用副本
  >     );
  > }
  > ```
  >
  > 当一开始你认为你捕获的是`divisor`的时候，**默认捕获模式**就是造成可能意外地捕获`this`的元凶。

  > [!tip]
  >
  > 在C++14中，一个更好的捕获成员变量的方式时使用**通用的*lambda*捕获**：
  >
  > ```c++
  > void Widget::addFilter() const
  > {
  >     filters.emplace_back(                   //C++14：
  >         [divisor = divisor](int value)      //拷贝divisor到闭包
  >         { return value % divisor == 0; }	//使用这个副本
  >     );
  > }
  > ```
  >
  > 这种通用的*lambda*捕获并没有默认的捕获模式，因此在C++14中，本条款的建议——避免使用默认捕获模式——仍然是成立的。

- 使用默认的按值捕获还有另外的一个缺点，它们预示了**相关的闭包是独立的并且不受外部数据变化的影响**。

  > *lambda*可能会依赖局部变量和形参（它们可能被捕获），还有**静态存储生命周期**（static storage duration）的对象。
  >
  > 例如，这些对象定义在**全局空间或者命名空间**，或者在类、函数、文件中声明为**`static`**。
  >
  > 默认按值捕获可能会因此误导你，让你以为捕获了这些变量。

- 这些对象定义在全局空间或者命名空间，或者在类、函数、文件中声明为`static`。能在*lambda*里使用，但它们不能被捕获。

  > ```cpp
  > void addDivisorFilter()
  > {
  >     static auto calc1 = computeSomeValue1();    //现在是static
  >     static auto calc2 = computeSomeValue2();    //现在是static
  >     static auto divisor =                       //现在是static
  >     computeDivisor(calc1, calc2);
  > 
  >     filters.emplace_back(
  >         [=](int value)                          //什么也没捕获到！
  >         { return value % divisor == 0; }        //引用上面的static
  >     );
  > 
  >     ++divisor;                                  //调整divisor
  > }
  > ```
  >
  > 这个*lambda*没有使用任何的non-`static`局部变量，所以它没有捕获任何东西

---

### 总结

> [!note]
>
> - 默认的按引用捕获可能会导致悬空引用。
> - 默认的按值捕获对于悬空指针很敏感（尤其是`this`指针），并且它会**误导**人产生*lambda*是独立的想法。

---



## **Item 32: Use init capture to move objects into closures**

### 初始化捕获

- 在某些场景下，按值捕获和按引用捕获都不是你所想要的。如果你有一个只能被移动的对象（例如`std::unique_ptr`或`std::future`）要进入到闭包里，**移动**该对象到闭包而不是复制它
- 缺少移动捕获被认为是C++11的一个缺点，标准化委员会选择了另一种方法。引入了一种新的捕获机制，移动捕获是它可以执行的技术之一。新功能被称作**初始化捕获**（*init capture*）

> [!important]
>
> 使用初始化捕获可以让你指定：
>
> 1. 从lambda生成的闭包类中的**数据成员名称**；
> 2. 初始化该成员的**表达式**；

- 初始化捕获将`std::unique_ptr`移动到闭包中的方法

  > ```c++
  > class Widget {                          //一些有用的类型
  > public:
  >     …
  >     bool isValidated() const;
  >     bool isProcessed() const;
  >     bool isArchived() const;
  > private:
  >     …
  > };
  > auto pw = std::make_unique<Widget>();   //创建Widget；使用std::make_unique
  >                                         //的有关信息参见条款21
  > …                                       //设置*pw
  > auto func = [pw = std::move(pw)]        //使用std::move(pw)初始化闭包数据成员
  >             { return pw->isValidated()
  >                      && pw->isArchived(); };
  > ```
  >
  > 高亮的文本包含了初始化捕获的使用（译者注：高亮了“`pw = std::move(pw)`”），“`=`”的左侧是指定的闭包类中数据成员的名称，右侧则是初始化表达式。
  >
  > **`=`”左侧的作用域不同于右侧的作用域**。左侧的作用域是闭包类，右侧的作用域和*lambda*定义所在的作用域相同。
  >
  > > [!tip]
  > >
  > > 如果`std::make_unique`创建的`Widget`处于适合被*lambda*捕获的状态，则**不需要局部变量`pw`**，因为闭包类的数据成员可以通过`std::make_unique`直接初始化：
  > >
  > > ```c++
  > > auto func = [pw = std::make_unique<Widget>()]   //使用调用make_unique得到的结果
  > >             { return pw->isValidated()          //初始化闭包数据成员
  > >                      && pw->isArchived(); };
  > > ```

- 在C++11中，无法捕获表达式的结果。 因此，初始化捕获的另一个名称是**通用\*lambda\*捕获**（*generalized lambda capture*）。

---

### C++11手动实现移动捕获

> [!important]
>
> 请记住，*lambda*表达式只是生成一个类和创建该类型对象的一种简单方式而已。

- 刚刚看到的C++14的示例代码可以用C++11重新编写，如下所示：

  > ```c++
  > class IsValAndArch {                            //“is validated and archived”
  > public:
  >     using DataType = std::unique_ptr<Widget>;
  >     
  >     explicit IsValAndArch(DataType&& ptr)       //条款25解释了std::move的使用
  >     : pw(std::move(ptr)) {}
  >     
  >     bool operator()() const
  >     { return pw->isValidated() && pw->isArchived(); }
  >     
  > private:
  >     DataType pw;
  > };
  > 
  > auto func = IsValAndArch(std::make_unique<Widget>())();
  > ```

- 坚持要使用*lambda*，移动捕获可以在C++11中这样模拟：

  > 1. **将要捕获的对象移动到由`std::bind`产生的函数对象中；**
  > 2. **将“被捕获的”对象的引用赋予给*lambda*。**
  >
  > 例如：假设你要创建一个本地的`std::vector`，在其中放入一组适当的值，然后将其移动到闭包中。
  >
  > ```cpp
  > //在C++14中，这很容易实现：
  > std::vector<double> data;               //要移动进闭包的对象
  > …                                       //填充data
  > auto func = [data = std::move(data)]    //C++14初始化捕获
  >             { /*使用data*/ };
  > 
  > //C++11的等效代码如下，其中我强调了相同的关键事项：
  > std::vector<double> data;               //同上
  > …                                       //同上
  > auto func =
  >     std::bind(                              //C++11模拟初始化捕获
  >         [](const std::vector<double>& data) //译者注：本行高亮
  >         { /*使用data*/ },
  >         std::move(data)                     //译者注：本行高亮
  >     );
  > ```
  >
  > `std::bind`返回的函数对象称为**bind对象**（*bind objects*）。
  >
  > `std::bind`的第一个实参是**可调用对象**，后续实参表示要传递给该对象的值。
  >
  > 一个bind对象包含了传递给`std::bind`的所有实参的副本。
  >
  > > [!warning]
  > >
  > > 添加了一个形参`data`来对应我们的伪移动捕获对象。此形参是对bind对象中`data`副本的**左值引用**。
  > >
  > > 因此，*lambda*将对绑定在对象内部的移动构造的`data`**副本**进行操作。

- 默认情况下，从*lambda*生成的闭包类中的`operator()`成员函数为`const`的

  > 因此，为了防止在*lambda*内修改该`data`副本，*lambda*的形参应声明为reference-to-`const`。
  >
  > 但是，将*lambda*声明为`mutable`，则闭包类中的`operator()`将不会声明为`const`，并且在*lambda*的形参声明中省略`const`也是合适的：
  >
  > ```c++
  > auto func =
  >     std::bind(                                  //C++11对mutable lambda
  >         [](std::vector<double>& data) mutable	//初始化捕获的模拟
  >         { /*使用data*/ },
  >         std::move(data)
  >     );
  > ```

- bind对象存储着传递给`std::bind`的所有实参的副本

  > bind对象包含由*lambda*生成的**闭包副本**， 因此闭包的生命周期与bind对象的生命周期相同
  >
  > 只要存在闭包，包含伪移动捕获对象的bind对象也将存在。

> [!important]
>
> 使用`std::bind`基本要点也应该清楚：
>
> - 无法移动构造一个对象到C++11闭包，但是可以将对象移动构造进C++11的bind对象。
> - 在C++11中模拟移动捕获包括将对象移动构造进bind对象，然后通过**传引用**将移动构造的对象传递给*lambda*。
> - 由于bind对象的生命周期与闭包对象的生命周期相同，因此**可以将bind对象中的对象视为闭包中的对象**。

- `std::bind`模仿移动捕获的第二个示例，这是我们之前看到的在闭包中创建`std::unique_ptr`的C++14代码：

  > 
  >
  > ```c++
  > auto func = [pw = std::make_unique<Widget>()]   //同之前一样
  >             { return pw->isValidated()          //在闭包中创建pw
  >                      && pw->isArchived(); };
  > ```
  >
  > 这是C++11的模拟实现：
  >
  > ```c++
  > auto func = std::bind(
  >                 [](const std::unique_ptr<Widget>& pw)
  >                 { return pw->isValidated()
  >                          && pw->isArchived(); },
  >                 std::make_unique<Widget>()
  >             );
  > ```
  >
  > 在[Item34](https://cntransgroup.github.io/EffectiveModernCppChinese/6.LambdaExpressions/item34.html)中，主张使用*lambda*而不是`std::bind`。

---



### 总结

> [!note]
>
> - 使用C++14的**初始化捕获**将对象移动到闭包中。
> - 在C++11中，通过**手写类或`std::bind`**的方式来模拟初始化捕获。

---



## **Item 33: Use `decltype` on `auto&&` parameters to `std::forward` them**

### lambada完美转发

> [!important]
>
> **泛型\*lambda\***（*generic lambdas*）是C++14中最值得期待的特性之一——因为在*lambda*的形参中可以使用**`auto`关键字**。
>
> 即在闭包类中的`operator()`函数是一个函数模版

> ```c++
> auto f = [](auto x){ return func(normalize(x)); };
> ```
>
> 对应的闭包类中的函数调用操作符看来就变成这样：
>
> ```c++
> class SomeCompilerGeneratedClassName {
> public:
>     template<typename T>                //auto返回类型见条款3
>     auto operator()(T x) const
>     { return func(normalize(x)); }
>     …                                   //其他闭包类功能
> };
> ```
>
> 在这个样例中，*lambda*对变量`x`做的唯一一件事就是把它转发给函数`normalize`。
>
> 如果函数`normalize`对左值右值的方式不一样，这个*lambda*的实现方式就不好

- 正确方式是把`x`完美转发给函数`normalize`

  > 首先，`x`需要改成通用引用（见[Item24](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item24.html)），
  >
  > 其次，需要使用`std::forward`将`x`转发到函数`normalize`（见[Item25](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item25.html)）。
  >
  > ```c++
  > auto f = [](auto&& x)
  >          { return func(normalize(std::forward<???>(x))); };
  > ```
  >
  > 在理论和实际之间应该传递给`std::forward`的什么类型?
  >
  > 这意味着在这个*lambda*中，可以通过检查形参`x`的类型来确定传递进来的实参是一个左值还是右值，`decltype`就可以实现这样的效果（见[Item3](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item3.html)）。
  >
  > > [!tip]
  > >
  > > 用**右值引用**类型和用**非引用**类型去初始化`std::forward`产生的相同的结果。
  >
  > 因此*lambda*的完美转发可以写成：
  >
  > ```c++
  > auto f =
  >     [](auto&& param)
  >     {
  >         return
  >             func(normalize(std::forward<decltype(param)>(param)));
  >     };
  > ```
  >
  > 再加上6个点，lambda*完美转发可以接受多个形参，因为C++14中的*lambda也可以是可变形参的：
  >
  > ```c++
  > auto f =
  >     [](auto&&... params)
  >     {
  >         return
  >             func(normalize(std::forward<decltype(params)>(params)...));
  >     };
  > ```

---

### 总结

> [!note]
>
> - 对`auto&&`形参使用`decltype`以`std::forward`它们。

---

## **Item 34: Prefer lambdas to `std::bind`**

### `std::bind`

C++11中的`std::bind`是C++98的`std::bind1st`和`std::bind2nd`的后续

| 在头文件 `<functional>` 中定义                               |      |                                      |
| ------------------------------------------------------------ | ---- | ------------------------------------ |
| `template< class F, class... Args > */\* 未指定 \*bind( F&& f, Args&&... args );` | (1)  | (自 C++11) (自 C++20 起为 constexpr) |
| `template< class R, class F, class... Args > \* 未指定 /* bind( F&& f, Args&&... args );` | (2)  | (自 C++11) (自 C++20 起为 constexpr) |

函数模板 `std::bind` 为 f 生成一个转发调用包装器。调用此包装器等效于调用 f，其中部分参数 [绑定](https://cppreference.cn/w/cpp/utility/functional/bind#Bound_arguments) 到 args。

对于绑定参数

对于每个存储的参数 arg_i，[`*INVOKE*`](https://cppreference.cn/w/cpp/utility/functional) 或 [`*INVOKE*`](https://cppreference.cn/w/cpp/utility/functional) 操作中的相应绑定参数 v_i 按如下方式确定

1. 情况 1：引用包装器

> 如果 arg_i 的类型为 [std::reference_wrapper](https://cppreference.cn/w/cpp/utility/functional/reference_wrapper)<T>（例如，[std::ref](https://cppreference.cn/w/cpp/utility/functional/ref) 或 [std::cref](https://cppreference.cn/w/cpp/utility/functional/ref) 在对 `std::bind` 的初始调用中使用），则 v_i 是 arg_i.get()，它的类型 `V_i` 是 `T&`：存储的参数按引用传递给调用的函数对象。

2. 情况 2：绑定表达式

   > 如果 arg_i 的类型为 `T`，对于它来说，[std::is_bind_expression](https://cppreference.cn/w/cpp/utility/functional/is_bind_expression)<T>::value 为 true（例如，另一个 `std::bind` 表达式直接传递给对 `std::bind` 的初始调用），则 `std::bind` 执行函数组合：它不会传递绑定子表达式将返回的函数对象，而是急切地调用该子表达式，并将它的返回值传递给外部可调用对象。如果绑定子表达式有任何占位符参数，则它们将与外部绑定共享（从 u1`, `u2`, ...` 中选取）。具体来说，v_i 是 arg_i([std::forward](https://cppreference.cn/w/cpp/utility/forward)<Uj>(uj)...)，它的类型 `V_i` 是 [std::result_of](https://cppreference.cn/w/cpp/types/result_of)<T *cv* ﻿&(Uj&&...)>::type&&(直到 C++17)[std::invoke_result_t](https://cppreference.cn/w/cpp/types/result_of)<T *cv* ﻿&, Uj&&...>&&(自 C++17 起)（cv 限定符与 g 相同）。
   >
   > 3. 

3. 情况 3：占位符

   > 如果 arg_i 的类型为 `T`，且 [std::is_placeholder](https://cppreference.cn/w/cpp/utility/functional/is_placeholder)<T>::value 不为 0（意味着，在对 `std::bind` 的初始调用中，使用了诸如 `std::placeholders::_1, _2, _3, ...` 之类的占位符作为参数），则占位符指示的参数（u1 用于 _1，u2 用于 _2，等等）将传递给可调用对象：v_i 为 [std::forward](https://cppreference.cn/w/cpp/utility/forward)<Uj>(uj)，其类型 `V_i` 为 `Uj&&`。

4. 情况 4：普通参数

   > 否则，arg_i 将作为左值参数传递给可调用对象：v_i 仅仅是 arg_i，其类型 `V_i` 为 `T` *cv* ﻿`&`，其中 *cv* 与 g 的 cv 限定符相同。

### 优先 `lambda`

- 优先*lambda*而不是`std::bind`的最重要原因是***lambda*更易读**。

  > 假设我们有一个设置警报器的函数：
  >
  > ```c++
  > //一个时间点的类型定义（语法见条款9）
  > using Time = std::chrono::steady_clock::time_point;
  > //“enum class”见条款10
  > enum class Sound { Beep, Siren, Whistle };
  > //时间段的类型定义
  > using Duration = std::chrono::steady_clock::duration;
  > //在时间t，使用s声音响铃时长d
  > void setAlarm(Time t, Sound s, Duration d);
  > ```
  >
  > 编写一个*lambda*来修改`setAlarm`的界面，以便仅需要指定声音
  >
  > ```c++
  > //setSoundL（“L”指代“lambda”）是个函数对象，允许指定一小时后响30秒的警报器的声音
  > auto setSoundL =
  >     [](Sound s) 
  >     {
  >         //使std::chrono部件在不指定限定的情况下可用
  >         using namespace std::chrono;
  > 
  >         setAlarm(steady_clock::now() + hours(1),    //一小时后响30秒的闹钟
  >                  s,                                
  >                  seconds(30)); //译注：setAlarm三行高亮
  >     };
  > ```
  >
  > 使用标准后缀如秒（`s`），毫秒（`ms`）和小时（`h`）等简化在C++14中的代码，其中标准后缀基于C++11对用户自定义常量的支持。这些后缀在**`std::literals`**命名空间中实现
  >
  > ```c++
  > auto setSoundL =
  >     [](Sound s)
  >     {
  >         using namespace std::chrono;
  >         using namespace std::literals;      //对于C++14后缀
  > 
  >         setAlarm(steady_clock::now() + 1h,	//C++14写法，但是含义同上
  >                  s,
  >                  30s);
  >     };
  > ```

- 对应的`std::bind`调用

  > ```cpp
  > using namespace std::chrono;                //同上
  > using namespace std::literals;
  > using namespace std::placeholders;          //“_1”使用需要
  > 
  > auto setSoundB =                            //“B”代表“bind”
  >     std::bind(setAlarm,
  >               steady_clock::now() + 1h,     //不正确！见下
  >               _1,
  >               30s);
  > ```
  >
  > 在`std::bind`调用中，将`steady_clock::now() + 1h`作为实参传递给了`std::bind`
  >
  > 警报器将被设置为在**调用`std::bind`后一小时**发出声音，而不是在调用`setAlarm`一小时后发出。
  >
  > 需要告诉`std::bind`推迟对表达式的求值，直到调用`setAlarm`为止，而这样做的方法是将对`std::bind`的第二个调用**嵌套**在第一个调用中：
  >
  > ```cpp
  > //C++14
  > auto setSoundB =
  >     std::bind(setAlarm,
  >               std::bind(std::plus<>(), std::bind(steady_clock::now), 1h),
  >               _1,
  >               30s);
  > 
  > 
  > ```
  >
  > > [!tip]
  > >
  > > 尖括号之间未指定任何类型，即该代码包含“`std::plus<>`”，而不是“`std::plus<type>`”。 在C++14中，通常可以**省略标准运算符模板的模板类型实参**，因此无需在此处提供。
  >
  > 等效于*lambda*的C++11 `std::bind`为：
  >
  > ```c++
  > using namespace std::chrono;                //同上
  > using namespace std::placeholders;
  > auto setSoundB =
  >     std::bind(setAlarm,
  >               std::bind(std::plus<steady_clock::time_point>(),
  >                         std::bind(steady_clock::now),
  >                         hours(1)),
  >               _1,
  >               seconds(30));
  > ```

-  假设有一个重载函数，其中第四个形参指定了音量：

  > ```c++
  > enum class Volume { Normal, Loud, LoudPlusPlus };
  > void setAlarm(Time t, Sound s, Duration d, Volume v);
  > ```
  >
  > *lambda*因为根据重载规则选择了`setAlarm`的三实参版本：
  >
  > ```c++
  > auto setSoundL =                            //和之前一样
  >     [](Sound s)
  >     {
  >         using namespace std::chrono;
  >         setAlarm(steady_clock::now() + 1h,  //可以，调用三实参版本的setAlarm
  >                  s,
  >                  30s);
  >     };
  > ```
  >
  > 然而，`std::bind`的调用将会编译失败：无法确定应将两个`setAlarm`函数中的哪一个传递给`std::bind`
  >
  > ```c++
  > auto setSoundB =                            //错误！哪个setAlarm？
  >     std::bind(setAlarm,
  >               std::bind(std::plus<>(),
  >                         steady_clock::now(),
  >                         1h),
  >               _1,
  > ```
  >
  > 必须将`setAlarm`强制转换为适当的**函数指针类型**：
  >
  > ```c++
  > using SetAlarm3ParamType = void(*)(Time t, Sound s, Duration d);
  > 
  > auto setSoundB =                                            //现在可以了
  >     std::bind(static_cast<SetAlarm3ParamType>(setAlarm),
  >               std::bind(std::plus<>(),
  >                         steady_clock::now(),
  >                         1h), 
  >               _1,
  >               30s);
  > ```

- 在*lambda*和`std::bind`的使用上带来了另一个区别。

  >  在`setSoundL`的函数调用操作符（即*lambda*的闭包类对应的函数调用操作符）内部，对`setAlarm`的调用是**正常的函数调用**，编译器可以按常规方式进行内联：
  >
  > ```c++
  > setSoundL(Sound::Siren);    //setAlarm函数体在这可以很好地内联
  > ```
  >
  > 对`std::bind`的调用是将**函数指针**传递给`setAlarm`，在`setSoundB`的函数调用操作符（即绑定对象的函数调用操作符）内部，对`setAlarm`的调用是通过一个函数指针。
  >
  >  编译器不太可能通过函数指针内联函数
  >
  > ```c++
  > setSoundB(Sound::Siren); 	//setAlarm函数体在这不太可能内联
  > ```
  >
  > 因此，使用*lambda*可能会比使用`std::bind`能生成更快的代码。

---



### 复杂的`lambda`

考虑以下C++14的*lambda*使用，它返回其实参是否在最小值（`lowVal`）和最大值（`highVal`）之间的结果，其中`lowVal`和`highVal`是**局部变量**：

```c++
//在C++11中，lambda也不能采用auto形参
auto betweenL =
    [lowVal, highVal]
    (const auto& val)                           //C++14
    { return lowVal <= val && val <= highVal; };
```

同理使用`std::bind`可以表达相同的内容

```c++
//在C++11中，我们必须指定要比较的类型
using namespace std::placeholders;              //同上
auto betweenB =
    std::bind(std::logical_and<>(),             //C++14
              std::bind(std::less_equal<>(), lowVal, _1),
              std::bind(std::less_equal<>(), _1, highVal));
```

---



### 占位符的行为

占位符（例如`_1`，`_2`等）的行为是不透明

- 有一个函数可以创建`Widget`的压缩副本：

  > ```cpp
  > enum class CompLevel { Low, Normal, High }; //压缩等级
  > 
  > Widget compress(const Widget& w,            //制作w的压缩副本
  >                 CompLevel lev);
  > ```
  >
  > 创建一个函数对象允许我们指定`Widget w`的压缩级别
  >
  > ```cpp
  > //std::bind
  > Widget w;
  > using namespace std::placeholders;
  > auto compressRateB = std::bind(compress, w, _1);  
  > ```
  >
  > 将`w`传递给`std::bind`时，必须将其存储起来，以便以后进行压缩
  >
  > `std::bind`总是**拷贝**它的实参，但是调用者可以使用引用来存储实参
  >
  > 即在`std::bind`中对于参数默认是按值传递，除非显示利用`std::ref`传引用
  >
  > 然而在*lambda*方法中，其中`w`是通过值还是通过引用捕获是**显式**的

- 对由`std::bind`生成的对象调用中，实参如何传递？

  ```c++
  compressRateB(CompLevel::High);     //实参如何传递？
  ```

  传递给bind对象的所有实参都是通过**引用传递**的，因为此类对象的函数调用运算符使用完美转发。

---

### `lambda and std::bind`

> [!important]
>
> 与*lambda*相比，使用`std::bind`进行编码的代码可读性较低，表达能力较低，并且效率可能较低。 
>
> **C++14**中，没有`std::bind`的合理用例。
>
> 在C++11中，可以在**两个受约束**的情况下证明使用`std::bind`是合理的：
>
> - **移动捕获**。C++11的*lambda*不提供移动捕获，但是可以通过结合*lambda*和`std::bind`来模拟。 有关详细信息，请参阅[Item32](https://cntransgroup.github.io/EffectiveModernCppChinese/6.LambdaExpressions/item32.html)，该条款还解释了在C++14中，*lambda*对初始化捕获的支持消除了这个模拟的需求。
> - **多态函数对象**。因为bind对象上的函数调用运算符使用完美转发，所以它可以接受任何类型的实参（以[Item30](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html)中描述的完美转发的限制为界限）。当你要绑定带有**模板化函数**调用运算符的对象时，此功能很有用。 

- 对于上述多态函数对象，例如这个类

  > ```c++
  > class PolyWidget {
  > public:
  >     template<typename T>
  >     void operator()(const T& param);
  >     …
  > };
  > ```
  >
  > `std::bind`可以如下绑定一个`PolyWidget`对象：
  >
  > ```c++
  > PolyWidget pw;
  > auto boundPW = std::bind(pw, _1);
  > ```
  >
  > `boundPW`可以接受任意类型的对象了：
  >
  > ```c++
  > boundPW(1930);              //传int给PolyWidget::operator()
  > boundPW(nullptr);           //传nullptr给PolyWidget::operator()
  > boundPW("Rosebud"); 		//传字面值给PolyWidget::operator()
  > ```
  >
  > 这一点无法使用C++11的*lambda*做到。 但是，在C++14中，可以通过带有**`auto`形参**的*lambda*轻松实现：
  >
  > ```c++
  > auto boundPW = [pw](const auto& param)  //C++14 
  >                { pw(param); };
  > ```

> [!tip]
>
>  在C++11中增加了*lambda*支持，这使得`std::bind`几乎已经过时了，从C++14开始，更是没有很好的用例了。

---

### 总结

> [!note]
>
> - 与使用`std::bind`相比，*lambda*更**易读**，更具表达力并且可能更**高效**。
> - 只有在C++11中，`std::bind`可能对实现**移动捕获**或绑定带有**模板化函数调用运算符的对象**时会很有用。

---

