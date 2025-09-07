[TOC]

# [第5章 右值引用，移动语义，完美转发](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item23.html#第5章-右值引用移动语义完美转发)

### 移动语义（*move semantics*）和完美转发（*perfect forwarding*）

1. **移动语义**

   > 使编译器有可能用廉价的**移动**操作来代替昂贵的**拷贝**操作
   >
   > 移动构造函数和移动赋值操作符也给了你控制移动语义的权力
   >
   > 移动语义也允许创建**只可移动（*move-only*）的类型**，例如`std::unique_ptr`，`std::future`和`std::thread`。

2. **完美转发**

   > - **完美转发**使接收**任意数量实参**的函数模板成为可能，它可以将实参转发到其他的函数，使目标函数接收到的实参与被传递给转发函数的**实参保持一致**。

3. **右值引用**是**连接**这两个截然不同的概念的胶合剂。它是使移动语义和完美转发变得可能的基础语言机制。

> [!tip]
>
> 1. **左值 (lvalue)**
>
>    > - **定义**：可以取地址、有持久状态的对象（通常有名字）。
>    > - **特点**：
>    >   - 代表一个 **具体的内存位置**。
>    >   - 生命周期通常超过当前表达式。
>    >   - 可以出现在赋值运算符的 **左侧或右侧**。
>    >
>    > ```cpp
>    > int a = 10;      // a 是左值
>    > int* p = &a;     // 可以取地址
>    > a = 20;          // 左值在赋值左侧
>    > int b = a;       // 左值在赋值右侧
>    > ```
>
> 2. **右值 (rvalue)**
>
>    > - **定义**：临时的、无法取地址的值（通常是表达式计算的中间结果）。
>    > - **特点**：
>    >   - 代表一个 **临时的值**，没有持久的内存地址。
>    >   - 生命周期仅限当前表达式。
>    >   - 只能出现在赋值运算符的 **右侧**。
>    >
>    > ```cpp
>    > int x = 5;             // 5 是右值（字面量）
>    > x = 2 + 3;             // 2+3 的结果是右值
>    > std::string s = "Hi";  // "Hi" 是右值
>    > ```
>
>    3. **扩展概念（C++11 后）**
>
>    - **将亡值 (xvalue)**：介于左值和右值之间（如 `std::move` 的结果）。
>    - **纯右值 (prvalue)**：字面量、表达式结果等传统右值。

- 非常重要的一点是要牢记形参永远是**左值**，即使它的类型是一个右值引用。

  ```cpp
  void f(Widget&& w);
  ```

---

## **Item 23: Understand `std::move` and `std::forward`**

`std::move`**不移动**（move）任何东西，`std::forward`也**不转发**（forward）任何东西。

在运行时，它们不做任何事情。它们不产生任何可执行代码，一字节也没有。

- `std::move`和`std::forward`仅仅是**执行转换（cast）的函数**（事实上是函数模板）。
- `std::move`无条件的将它的**实参转换为右值**
- `std::forward`只在**特定情况满足**时下进行转换

---

### `std::move`

- C++11的`std::move`的示例实现。它并不完全满足标准细则

  > ```cpp
  > template<typename T>                            //在std命名空间
  > typename remove_reference<T>::type&&
  > move(T&& param)
  > {
  >     using ReturnType =                          //别名声明，见条款9
  >         typename remove_reference<T>::type&&;
  > 
  >     return static_cast<ReturnType>(param);
  > }
  > ```
  >
  > - `std::move`接受一个对象的引用（准确的说，一个**通用引用**（universal reference），见[Item24](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item24.html))，返回一个指向同对象的引用。
  > - 函数返回类型的`&&`部分表明`std::move`函数返回的是一个右值引用
  > - 但是，正如[Item28](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item28.html)所解释的那样，如果类型`T`恰好是一个左值引用，那么`T&&`将会成为一个左值引用。为了避免如此，*type trait*（见[Item9](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item9.html)）**`std::remove_reference`**应用到了类型`T`上，这保证了`std::move`返回的真的是右值引用。

- 在C++14中，**函数返回值类型推导**（见[Item3](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item3.html)）和**标准库的模板别名**`std::remove_reference_t`（见[Item9](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item9.html)），`std::move`可以这样写：

  > ```cpp
  > template<typename T>
  > decltype(auto) move(T&& param)          //C++14，仍然在std命名空间
  > {
  >     using ReturnType = remove_referece_t<T>&&;
  >     return static_cast<ReturnType>(param);
  > }
  > ```
  >
  > `std::move`除了**转换它的实参到右值**以外什么也不做
  >
  > 它只进行转换，不移动任何东西。

- 事实上，右值只不过**经常**是移动操作的候选者。

  > 这个类的构造函数接受一个包含有注解的`std::string`作为形参，然后它复制该形参到数据成员。
  >
  > ```cpp
  > class Annotation {
  > public:
  >     //能使用const就使用const保持一致
  >     explicit Annotation(const std::string text)
  >     ：value(std::move(text))    //“移动”text到value里；这段代码执行起来,当复制text到一个数据成员的时候，为了避免一次复制操作的代价
  >     { … }                       //并不是看起来那样
  >     
  >     …
  > 
  > private:
  >     std::string value;
  > };
  > ```
  >
  > 这段代码与你期望中的完美实现的唯一区别，是`text`并不是被移动到`value`，而是被**拷贝**。
  >
  > 在转换之前，`text`是一个左值的`const std::string`，而转换的结果是一个右值的`const std::string`
  >
  > ```cpp
  > class string {                  //std::string事实上是
  > public:                         //std::basic_string<char>的类型别名
  >     …
  >     string(const string& rhs);  //拷贝构造函数
  >     string(string&& rhs);       //移动构造函数
  >     …
  > };
  > ```
  >
  > `std::move(text)`的结果是一个`const std::string`的右值。
  >
  > **该右值却可以被传递给`std::string`的拷贝构造函数，因为lvalue-reference-to-`const`允许被绑定到一个`const`右值上。**

  > [!warning]
  >
  > 总结
  >
  > 1. 第一，不要在你希望能移动对象的时候，声明他们为`const`。对`const`对象的移动请求会悄无声息的被转化为拷贝操作。
  > 2. 第二点，`std::move`不仅不移动任何东西，而且它也不保证它执行转换的对象可以被移动。
  > 3. 关于`std::move`，你能确保的唯一一件事就是将它应用到一个对象上，你能够得到一个右值。

---

### `std::forward`

- `std::forward`只有在满足一定条件的情况下才执行转换。`std::forward`是**有条件**的转换。

  > 最常见的情景是一个模板函数，接收一个通用引用形参，并将它传递给另外的函数：
  >
  > ```cpp
  > void process(const Widget& lvalArg);        //处理左值
  > void process(Widget&& rvalArg);             //处理右值
  > 
  > template<typename T>                        //用以转发param到process的模板
  > void logAndProcess(T&& param)
  > {
  >     auto now =                              //获取现在时间
  >         std::chrono::system_clock::now();
  >     
  >     makeLogEntry("Calling 'process'", now);
  >     process(std::forward<T>(param));
  > }
  > 
  > Widget w;
  > 
  > logAndProcess(w);               //用左值调用
  > logAndProcess(std::move(w));    //用右值调用
  > ```
  >
  > 当且仅当传递给函数`logAndProcess`的用以初始化`param`的实参是一个右值时，`param`会被转换为一个右值。
  >
  > `std::forward`是一个**有条件**的转换：它的**实参用右值初始化**时，转换为一个右值。

---

### `std::move vs std::forward`

> [!note]
>
> 它们唯一的区别就是`std::move`总是执行转换，而`std::forward`偶尔为之。
>
> `std::forward`是可以完全胜任，`std::move`并非必须。

- `std::move`的吸引力在于它的便利性

  > 减少了出错的可能性，增加了代码的清晰程度。
  >
  > 假设`static`的计数器，它会在移动构造的时候自增
  >
  > ```cpp
  > class Widget {
  > public:
  >     Widget(Widget&& rhs)
  >     : s(std::move(rhs.s))
  >     { ++moveCtorCalls; }
  > 
  >     …
  > 
  > private:
  >     static std::size_t moveCtorCalls;
  >     std::string s;
  > };
  > ```
  >
  > 如果要用`std::forward`来达成同样的效果
  >
  > ```cpp
  > class Widget{
  > public:
  >     Widget(Widget&& rhs)                    //不自然，不合理的实现
  >     : s(std::forward<std::string>(rhs.s))
  >     { ++moveCtorCalls; }
  >     …
  > }
  > ```
  >
  > `std::forward`不但需要一个函数实参（`rhs.s`），还需要一个模板类型实参`std::string`。
  >
  > 传递给`std::forward`的类型应当是一个non-reference
  >
  > 这意味着`std::move`比起`std::forward`来说需要打更少的字，并且免去了传递一个表示我们正在传递一个右值的类型实参。
  >
  > 它根绝了我们**传递错误类型**的可能性（例如，`std::string&`可能导致数据成员`s`被复制而不是被移动构造）

- 更重要的是，`std::move`的使用代表着**无条件向右值**的转换，而使用`std::forward`只对**绑定了右值的引用**进行到右值转换。

- 前者是典型地为了**移动操作**，

- 而后者只是**传递（亦为转发）**一个对象到另外一个函数，保留它原有的左值属性或右值属性。

---

### 总结

> [!note]
>
> - `std::move`执行到右值的无条件的转换，但就自身而言，它不移动任何东西。
> - `std::forward`只有当它的参数被绑定到一个右值时，才将参数转换为右值。
> - `std::move`和`std::forward`在运行期什么也不做。

---

## **Item 24: Distinguish universal references from rvalue references**

### `T&&`

- 为了声明一个指向某个类型`T`的右值引用，你写下了`T&&`。

  > ```cpp
  > void f(Widget&& param);             //右值引用
  > Widget&& var1 = Widget();           //右值引用
  > auto&& var2 = var1;                 //不是右值引用
  > 
  > template<typename T>
  > void f(std::vector<T>&& param);     //右值引用
  > 
  > template<typename T>
  > void f(T&& param);                  //不是右值引用
  > ```
  >
  > > [!tip]
  > >
  > > “`T&&`”有两种不同的意思。
  > >
  > > 1. 第一种，当然是**右值引用**。它们只绑定到右值上，并且它们主要的存在原因就是为了**识别可以移动操作的对象**。
  > > 2. “`T&&`”的另一种意思是，它既可以是右值引用，也可以是左值引用。它们既可以绑定到右值上（就像右值引用），也可以绑定到左值上（就像左值引用）。 此外，它们还可以绑定到`const`或者non-`const`的对象上，也可以绑定到`volatile`或者non-`volatile`的对象上，甚至可以绑定到既`const`又`volatile`的对象上。叫做**通用引用**（*universal references*）

---

### 通用引用

在两种情况下会出现通用引用。

1. 最常见的一种是函数模板形参

   > ```cpp
   > template<typename T>
   > void f(T&& param);                  //param是一个通用引用
   > ```

2. 第二种情况是`auto`声明符

   > ```cpp
   > auto&& var2 = var1;                 //var2是一个通用引用
   > ```

3. 这两种情况的共同之处就是都存在**类型推导**（*type deduction*）

4. 如果你看见“`T&&`”不带有类型推导，那么你看到的就是一个右值引用：

   > ```cpp
   > void f(Widget&& param);         //没有类型推导，
   >                                 //param是一个右值引用
   > Widget&& var1 = Widget();       //没有类型推导，
   >                                 //var1是一个右值引用
   > ```

5. 因为通用引用是引用，所以它们**必须被初始化**。

   > ```cpp
   > template<typename T>
   > void f(T&& param);              //param是一个通用引用
   > 
   > Widget w;
   > f(w);                           //传递给函数f一个左值；param的类型
   >                                 //将会是Widget&，也即左值引用
   > 
   > f(std::move(w));                //传递给f一个右值；param的类型会是
   >                                 //Widget&&，即右值引用
   > ```
   >
   > 一个通用引用的初始值决定了它是代表了右值引用还是左值引用。

6. 对一个通用引用而言，**类型推导**是必要的，但是它还不够。**引用声明**的**形式**必须正确，并且该形式是被限制的。它必须**恰好为“`T&&`”**。

   > 1. 没有类型推导的情况
   >
   >    ```cpp
   >    template <typename T>
   >    void f(std::vector<T>&& param);     //param是一个右值引用
   >    
   >    std::vector<int> v;
   >    f(v);                           //错误！不能将左值绑定到右值引用
   >    ```
   >
   > 2. 一个简单的**`const`修饰符**的出现
   >
   >    ```cpp
   >    template <typename T>
   >    void f(const T&& param);        //param是一个右值引用
   >    ```
   >
   > 3. 在模板内部并不保证一定会发生类型推导。
   >
   >    ```cpp
   >    template<class T, class Allocator = allocator<T>>   //来自C++标准
   >    class vector
   >    {
   >    public:
   >        void push_back(T&& x);
   >        …
   >    }
   >    ```
   >
   >    `push_back`在有一个特定的`vector`实例之前不可能存在，而实例化`vector`时的类型已经决定了`push_back`的声明。
   >
   >    函数`push_back`不包含任何类型推导。
   >
   >    > [!warning]
   >    >
   >    > `emplace_back`，却确实包含类型推导
   >    >
   >    > ```cpp
   >    > template<class T, class Allocator = allocator<T>>   //依旧来自C++标准
   >    > class vector {
   >    > public:
   >    >     template <class... Args>
   >    >     void emplace_back(Args&&... args);
   >    >     …
   >    > };
   >    > ```
   >    >
   >    > 类型参数（*type parameter*）`Args`是独立于`vector`的类型参数`T`的，所以`Args`会在每次`emplace_back`被调用的时候被推导。

7. 类型声明为`auto&&`的变量是通用引用

   > 一个C++14标准的*lambda*表达式，来记录任意函数调用的时间开销，你可以这样写：
   >
   > ```cpp
   > auto timeFuncInvocation =
   >     [](auto&& func, auto&&... params)           //C++14
   >     {
   >         start timer;
   >         std::forward<decltype(func)>(func)(     //对params调用func
   >             std::forward<delctype(params)>(params)...
   >         );
   >         stop timer and record elapsed time;
   >     };
   > ```
   >
   > `func`是一个**通用引用**，可以被绑定到任何可调用对象，无论左值还是右值。
   >
   > `args`是0个或者多个通用引用（即它是个**通用引用*parameter pack***），它可以绑定到任意数目、任意类型的对象上。

---

### 总结

> [!note]
>
> - 如果一个函数模板形参的类型为**`T&&`，并且`T`需要被推导得知**，或者如果一个对象被声明为**`auto&&`**，这个形参或者对象就是一个通用引用。
> - 如果类型声明的形式不是标准的`type&&`，或者如果类型推导没有发生，那么`type&&`代表一个右值引用。
> - 通用引用，如果它被右值初始化，就会对应地成为右值引用；如果它被左值初始化，就会成为左值引用。

---

## **Item 25: Use `std::move` on rvalue references, `std::forward` on universal references**

### 右值引用和通用引用

1. 右值引用仅绑定**可以移动**的对象。

   > 如果你有一个右值引用形参就知道这个对象可能会被移动：
   >
   > ```cpp
   > class Widget {
   >  Widget(Widget&& rhs);       //rhs定义上引用一个有资格移动的对象
   >  …
   > };
   > ```
   >
   > 这样做的方法是将绑定到此类对象的形参转换为右值
   >
   > ```cpp
   > class Widget {
   > public:
   >     Widget(Widget&& rhs)        //rhs是右值引用
   >     : name(std::move(rhs.name)),
   >       p(std::move(rhs.p))
   >       { … }
   >     …
   > private:
   >     std::string name;
   >     std::shared_ptr<SomeDataStructure> p;
   > };
   > ```

2. 通用引用**可能**绑定到有资格移动的对象上。

> 通用引用使用右值初始化时，才将其强制转换为右值
>
> 这正是`std::forward`所做的：
> 
>  ```cpp
>  class Widget {
> public:
>     template<typename T>
>    void setName(T&& newName)           //newName是通用引用
>     { name = std::forward<T>(newName); }
>
>     …
> };
> ```

> [!warning]
>
> 当把**右值引用**转发给其他函数时，右值引用应该被**无条件转换**为右值（通过`std::move`），因为它们**总是**绑定到右值；
>
> 当**转发通用引用**时，通用引用应该**有条件地转换**为右值（通过`std::forward`），因为它们只是**有时**绑定到右值。

---

### 何时使用

1. 在右值引用上使用`std::forward`表现出适当的行为，但是代码较长，容易出错，所以应该避免在右值引用上使用`std::forward`。同样在通用引用上使用`std::move`，这可能会意外改变左值（比如局部变量）：

   > ```cpp
   > class Widget {
   > public:
   >     template<typename T>
   >     void setName(T&& newName)       //通用引用可以编译，
   >     { name = std::move(newName); }  //但是代码太太太差了！
   >     …
   > 
   > private:
   >     std::string name;
   >     std::shared_ptr<SomeDataStructure> p;
   > };
   > 
   > std::string getWidgetName();        //工厂函数
   > 
   > Widget w;
   > 
   > auto n = getWidgetName();           //n是局部变量
   > 
   > w.setName(n);                       //把n移动进w！
   > 
   > …                                   //现在n的值未知
   > 
   > ```
   >
   > `setName`内部使用`std::move`无条件将传递的引用形参转换为右值，**`n`的值被移动进`w.name`**，调用`setName`返回时`n`最终变为未定义的值。

2. 如果为`const`左值和为右值分别重载`setName`可以避免整个问题，比如这样：

   > ```cpp
   > class Widget {
   > public:
   >     void setName(const std::string& newName)    //用const左值设置
   >     { name = newName; }
   >     
   >     void setName(std::string&& newName)         //用右值设置
   >     { name = std::move(newName); }
   >     
   >     …
   > };
   > ```
   >
   > 有缺点。首先编写和维护的代码更多（两个函数而不是单个模板）；其次，效率下降。
   >
   > 其次，比如，考虑如下场景：
   >
   > ```cpp
   > w.setName("Adela Novak");
   > ```
   >
   > `setName`重载版本，会有一个临时`std::string`对象被创建，`setName`形参绑定到这个对象，然后这个临时`std::string`移动到`w`的数据成员中。
   >
   > 一次`setName`的调用会包括**`std::string`构造函数**调用（创建中间对象），**`std::string`赋值运算符**调用（移动`newName`到`w.name`），**`std::string`析构函数**调用（析构中间对象）
   >
   > 比调用接受`const char*`指针的`std::string`赋值运算符开销昂贵许多。

3. 关于对左值和右值的重载函数最重要的问题不是源代码的数量，也不是代码的运行时性能。而是设计的可扩展性差。

   > `Widget::setName`有一个形参，因此需要两种重载实现，但是对于有更多形参的函数，每个都可能是左值或右值，重载函数的数量几何式增长：n个参数的话，就要实现2n种重载。
   >
   > 此类函数的典型代表是`std::make_shared`，还有对于C++14的`std::make_unique`（见[Item21](https://cntransgroup.github.io/EffectiveModernCppChinese/4.SmartPointers/item21.html)）。
   >
   > ```cpp
   > template<class T, class... Args>                //来自C++11标准
   > shared_ptr<T> make_shared(Args&&... args);
   > 
   > template<class T, class... Args>                //来自C++14标准
   > unique_ptr<T> make_unique(Args&&... args);
   > ```
   >
   > 肯定使用`std::forward`传递通用引用形参给其他函数

4. 在某些情况，你可能需要在一个函数中**多次使用绑定到右值引用或者通用引用的对象**，并且确保在完成其他操作前，这个对象不会被移动。

   > 只想在最后一次使用时，使用`std::move`（对右值引用）或者`std::forward`（对通用引用）
   >
   > ```cpp
   > template<typename T>
   > void setSignText(T&& text)                  //text是通用引用
   > {
   >   sign.setText(text);                       //使用text但是不改变它
   >   
   >   auto now = 
   >       std::chrono::system_clock::now();     //获取现在的时间
   >   
   >   signHistory.add(now, 
   >                   std::forward<T>(text));   //有条件的转换为右值
   > }
   > ```
   >
   > 确保`text`的值不会被`sign.setText`改变
   >
   > 对于`std::move`，同样的思路（即最后一次用右值引用的时候再调用`std::move`）
   >
   > > [!warning]
   > >
   > > 在有些稀少的情况下，你需要调用`std::move_if_noexcept`代替`std::move`

---



### 返回值绑定

- 在**按值**返回的函数中，返回值绑定到右值引用或者通用引用上，需要对返回的引用使用`std::move`或者`std::forward`。

  > 考虑两个矩阵相加的`operator+`函数，左侧的矩阵为右值（可以被用来保存求值之后的和）：
  >
  > ```cpp
  > Matrix                              //按值返回
  > operator+(Matrix&& lhs, const Matrix& rhs)
  > {
  >     lhs += rhs;
  >     return std::move(lhs);	        //移动lhs到返回值中
  > }
  > ```
  >
  > 在`return`语句中将`lhs`转换为右值（通过`std::move`），`lhs`可以移动到返回值的内存位置。
  >
  > 如果`Matrix`不支持移动操作，将其转换为右值不会变差，因为右值可以直接被`Matrix`的拷贝构造函数拷贝

- 使用通用引用和`std::forward`的情况类似。

  > 考虑函数模板`reduceAndCopy`收到一个未规约（unreduced）对象`Fraction`，将其规约，并返回一个规约后的副本。
  >
  > 如果原始对象是右值，可以将其移动到返回值中（避免拷贝开销），
  >
  > 但是如果原始对象是左值，必须创建副本，
  >
  > ```cpp
  > template<typename T>
  > Fraction                            //按值返回
  > reduceAndCopy(T&& frac)             //通用引用的形参
  > {
  >     frac.reduce();
  >     return std::forward<T>(frac);		//移动右值，或拷贝左值到返回值中
  > }
  > ```

---

### 返回值优化

- 对我要返回的局部对象应用同样的优化。对要被拷贝到返回值的右值引用形参使用`std::move`，会把拷贝构造变为移动构造

  > ```cpp
  > Widget makeWidget()                 //makeWidget的移动版本
  > {
  >     Widget w;
  >     …
  >     return std::move(w);            //移动w到返回值中（不要这样做！）
  > }
  > ```
  >
  > `makeWidget`的“拷贝”版本可以避免复制局部变量`w`的需要，通过在分配给函数返回值的内存中构造`w`来实现。这就是所谓的**返回值优化**（*return value optimization*，RVO）

- 编译器可能会在按值返回的函数中消除对局部对象的拷贝（或者移动）

  > 如果满足
  >
  > 1. 局部对象与函数返回值的**类型相同**；
  > 2. 局部对象就是要返回的东西。（适合的局部对象包括大多数**局部变量**（比如`makeWidget`里的`w`），还有作为`return`语句的一部分而创建的**临时对象**。而函数形参不满足要求。
  >
  > > [!tip]
  > >
  > > 一些人将RVO的应用区分为**命名的和未命名的（即临时的）局部对象**，限制了RVO术语应用到未命名对象上，并把对命名对象的应用称为**命名返回值优化**（*named return value optimization*，NRVO）。）

- 再看看`makeWidget`的“拷贝”版本：

  > ```cpp
  > Widget makeWidget()                 //makeWidget的“拷贝”版本
  > {
  >     Widget w;
  >     …
  >     return w;                       //“拷贝”w到返回值中
  > }
  > ```
  >
  > 意味着`makeWidget`的“拷贝”版本实际上不拷贝任何东西。
  >
  > 而`makeWidget`的移动版本不满足这条件
  >
  > ```cpp
  > return std::move(w);
  > ```
  >
  > 返回的已经不是局部对象`w`，而是**`w`的引用**——`std::move(w)`的结果。
  >
  > 开发者试图对要返回的局部变量用`std::move`帮助编译器优化，反而限制了编译器的优化选项。

- 应用`std::move`到一个局部对象上**仍然**是一个坏主意。

  > C++标准关于RVO的部分表明，如果满足RVO的条件，但是编译器选择不执行拷贝消除，则返回的对象**必须被视为右值**。
  >
  > 在某些情况下，将`std::move`应用于局部变量可能是一件合理的事（即，你把一个变量传给函数，并且知道不会再用这个变量），但是**满足RVO的`return`语句或者返回一个传值形参**并不在此列。

---

### 总结

> [!note]
>
> - **最后一次使用**时，在右值引用上使用`std::move`，在通用引用上使用`std::forward`。
> - 对按值返回的函数要返回的右值引用和通用引用，执行相同的操作。
> - 如果局部对象可以被**返回值优化**消除，就绝不使用`std::move`或者`std::forward`。

---

## **Item 26: Avoid overloading on universal references**

### 示例

- 假定你需要写一个函数，它使用名字作为形参，打印当前日期和时间到日志中，然后将名字加入到一个全局数据结构中。

> ```cpp
> std::multiset<std::string> names;           //全局数据结构
> void logAndAdd(const std::string& name)
> {
>     auto now =                              //获取当前时间
>         std::chrono::system_clock::now();
>     log(now, "logAndAdd");                  //志记信息
>     names.emplace(name);                    //把name加到全局数据结构中；
> }                                           //emplace的信息见条款42
> ```
>
> 代码没有问题，但是同样的也**没有效率**。考虑这三个调用：
>
> ```cpp
> std::string petName("Darla");
> logAndAdd(petName);                     //传递左值std::string
> 
> //有个拷贝代价，但是我们应该能用移动勉强应付。
> logAndAdd(std::string("Persephone"));	//传递右值std::string
> 
> //有个std::string拷贝开销，但是我们连移动开销都不想要，更别说拷贝的。
> logAndAdd("Patty Dog");                 //传递字符串字面值
> ```
>
> 通过使用通用引用（参见[Item24](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item24.html)）重写`logAndAdd`来使第二个和第三个调用效率提升
>
> ```cpp
> template<typename T>
> void logAndAdd(T&& name)
> {
>     auto now = std::chrono::system_clock::now();
>     log(now, "logAndAdd");
>     names.emplace(std::forward<T>(name));
> }
> 
> std::string petName("Darla");           //跟之前一样
> logAndAdd(petName);                     //跟之前一样，拷贝左值到multiset
> logAndAdd(std::string("Persephone"));	//移动右值而不是拷贝它
> logAndAdd("Patty Dog");                 //在multiset直接创建std::string
>                                         //而不是拷贝一个临时std::string
> ```

- 但是如果客户不总是有直接访问`logAndAdd`要求的名字的权限。有些客户只有索引，`logAndAdd`拿着索引在表中查找相应的名字。

  > `logAndAdd`需要重载为：
  >
  > ```cpp
  > std::string nameFromIdx(int idx);   //返回idx对应的名字
  > 
  > void logAndAdd(int idx)             //新的重载
  > {
  >     auto now = std::chrono::system_clock::now();
  >     log(now, "logAndAdd");
  >     names.emplace(nameFromIdx(idx));
  > }
  > 
  > std::string petName("Darla");           //跟之前一样
  > 
  > logAndAdd(petName);                     //跟之前一样，
  > logAndAdd(std::string("Persephone")); 	//这些调用都去调用
  > logAndAdd("Patty Dog");                 //T&&重载版本
  > 
  > logAndAdd(22);                          //调用int重载版本
  > 
  > ```
  >
  > 假定一个客户将`short`类型索引传递给`logAndAdd`：
  >
  > ```cpp
  > short nameIdx;
  > …                                       //给nameIdx一个值
  > logAndAdd(nameIdx);                     //错误！
  > ```
  >
  > 使用通用引用的那个推导出`T`的类型是`short`，因此可以精确匹配。
  >
  > 对于`int`类型参数的重载也可以在`short`类型提升后匹配成功。
  >
  > 根据正常的重载解决规则，**精确匹配优先于类型提升的匹配**，所以被调用的是通用引用的重载。
  >
  > 但是`logAndAdd`调用里的`multiset::emplace`调用里的`std::string`构造函数调用失败。

- 使用通用引用的函数在C++中是最贪婪的函数。

  > 几乎可以精确匹配任何类型的实参（极少不适用的实参在[Item30](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html)中介绍）。

---

### 完美转发构造函数

- 一个更容易掉入这种陷阱的例子是写一个完美转发构造函数。

  > 不用写接受`std::string`或者用索引查找`std::string`的自由函数，只是想一个构造函数有着相同操作的`Person`类：
  >
  > ```cpp
  > class Person {
  > public:
  >  template<typename T>            //完美转发的构造函数
  >  explicit Person(T&& n)
  >  : name(std::forward<T>(n)) {}
  > 
  >  explicit Person(int idx);       //int的构造函数
  > 
  >  Person(const Person& rhs);      //拷贝构造函数（编译器生成）
  >  Person(Person&& rhs);           //移动构造函数（编译器生成）
  >  …
  > };
  > 
  > Person p("Nancy"); 
  > auto cloneOfP(p);                   //从p创建新Person；这通不过编译！
  > //尝试使用Person对象p初始化Person的std::string数据成员
  > ```
  >
  > 这份代码不是调用拷贝构造函数，而是调用完美转发构造函数。
  >
  > 编译器的理由如下：`cloneOfP`被non-`const`左值`p`初始化，这意味着模板化构造函数可被实例化为采用`Person`类型的non-`const`左值。
  >
  > ```cpp
  > class Person {
  > public:
  >  explicit Person(Person& n)          //由完美转发模板初始化
  >  : name(std::forward<Person&>(n)) {}
  > 
  >  explicit Person(int idx);           //同之前一样
  > 
  >  Person(const Person& rhs);          //拷贝构造函数（编译器生成的）
  >  …
  > };
  > 
  > //在这个语句中，
  > auto cloneOfP(p);
  > ```
  >
  > “拷贝”non-`const`左值类型的`Person`交由完美转发构造函数处理，而不是拷贝构造函数。
  >
  > 果我们将本例中的传递的对象改为`const`的，会得到完全不同的结果：
  >
  > ```cpp
  > const Person cp("Nancy");   //现在对象是const的
  > auto cloneOfP(cp);          //调用拷贝构造函数！
  > ```
  >
  > 被拷贝的对象是`const`，是拷贝构造函数的精确匹配。

- 当**继承**纳入考虑范围时，完美转发的构造函数与编译器生成的拷贝、移动操作之间的交互会更加复杂。

  > 派生类的拷贝和移动操作的传统实现会表现得非常奇怪
  >
  > ```cpp
  > class SpecialPerson: public Person {
  > public:
  >     SpecialPerson(const SpecialPerson& rhs) //拷贝构造函数，调用基类的
  >     : Person(rhs)                           //完美转发构造函数！
  >     { … }
  > 
  >     SpecialPerson(SpecialPerson&& rhs)      //移动构造函数，调用基类的
  >     : Person(std::move(rhs))                //完美转发构造函数！
  >     { … }
  > };
  > ```

---

### 总结

> [!note]
>
> - 对通用引用形参的函数进行重载，通用引用函数的调用机会几乎总会比你期望的多得多。
> - **完美转发构造函数是糟糕的实现**，因为对于non-`const`左值，它们比拷贝构造函数而更匹配，而且会劫持派生类对于基类的拷贝和移动构造函数的调用。

---



## **Item 27: Familiarize yourself with alternatives to overloading on universal references**

[Item26](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item26.html)中说明了对使用**通用引用形参**的函数，无论是独立函数还是成员函数（尤其是构造函数），进行重载都会导致一系列问题。

这个条款探讨了几种，通过**避免在通用引用上重载**的设计，或者通过**限制通用引用**可以匹配的参数类型，来实现所期望行为的方法。

### 放弃重载

在[Item26](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item26.html)中的第一个例子中，`logAndAdd`是许多函数的代表，这些函数可以使用不同的名字来避免在通用引用上的重载的弊端。

> 两个重载的`logAndAdd`函数，可以分别改名为`logAndAddName`和`logAndAddNameIdx`。
>
> ```cpp
> template<typename T>
> void logAndAddName(T&& name)
> {
>  auto now = std::chrono::system_clock::now();
>  log(now, "logAndAdd");
>  names.emplace(std::forward<T>(name));
> }
> 
> void logAndAddNameIdx(int idx)             //新的重载
> {
>  auto now = std::chrono::system_clock::now();
>  log(now, "logAndAdd");
>  names.emplace(nameFromIdx(idx));
> }
> 
> ```

> [!important]
>
> 这种方式不能用在第二个例子，`Person`构造函数中，因为**构造函数名与类名**相同

---

### 传递const T&

退回到C++98，然后将传递通用引用替换为传递`lvalue-refrence-to-const`。

> 缺点是效率不高。
>
> ```cpp
> void logAndAdd(const std::string& name)
> {
>  auto now =                              //获取当前时间
>      std::chrono::system_clock::now();
>  log(now, "logAndAdd");                  //志记信息
>  names.emplace(name);                    //把name加到全局数据结构中；
> }    
> ```

---

### 传值

通常在不增加复杂性的情况下提高性能的一种方法是，将按传引用形参替换为**按值传递**，这是违反直觉的。

该设计遵循[Item41](https://cntransgroup.github.io/EffectiveModernCppChinese/8.Tweaks/item41.html)中给出的建议，即在你**知道要拷贝时就按值传递**

> 在`Person`的例子中展示：
>
> ```cpp
> class Person {
> public:
>     explicit Person(std::string n)  //代替T&&构造函数，
>     : name(std::move(n)) {}         //std::move的使用见条款41
>   
>     explicit Person(int idx)        //同之前一样
>     : name(nameFromIdx(idx)) {}
>     …
> 
> private:
>     std::string name;
> };
> 
> ```
>
> 因为没有`std::string`构造函数可以接受整型参数，所有`int`或者其他整型变量（比如`std::size_t`、`short`、`long`等）都会使用`int`类型重载的构造函数。
>
> > [!warning]
> >
> > 使用`0`或者`NULL`指代空指针会调用`int`重载的构造函数，而非指针类型的构造函数。

---

### 使用`tag dispatch`

> [!important]
>
> 传递`lvalue-reference-to-const`以及按值传递都不支持完美转发。如果使用通用引用的动机是**完美转发**，我们就只能使用通用引用



> [!note]
>
> *tag dispatch*方法:
>
> 通过查看所有重载的所有形参以及调用点的所有传入实参，然后选择最优匹配的函数——**考虑所有形参/实参的组合**。
>
> 通用引用通常提供了最优匹配，但是如果通用引用是包含其他**非**通用引用的形参列表的一部分，则非通用引用形参的较差匹配会使有一个通用引用的重载版本不被运行。

```cpp
std::multiset<std::string> names;       //全局数据结构

template<typename T>                    //志记信息，将name添加到数据结构
void logAndAdd(T&& name)
{
    auto now = std::chrono::system_clokc::now();
    log(now, "logAndAdd");
    names.emplace(std::forward<T>(name));
}
```

如果引入一个`int`类型的重载来用索引查找对象，就会重新陷入[Item26](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item26.html)中描述的麻烦。

> 重新实现`logAndAdd`函数**分拆**为两个函数，一个针对整型值，一个针对其他。`logAndAdd`本身接受所有实参类型，包括整型和非整型。
>
> **真正执行逻辑**的函数命名为`logAndAddImpl`，即我们使用重载。
>
> 1. 其中一个函数**接受通用引用**。所以我们同时使用了重载和通用引用。
> 2. 每个函数接受第二个形参，表征传入的实参是否为整型。

```cpp
template<typename T>
void logAndAdd(T&& name)
{
    //多传递了一个表示形参T是否为整型的实参
    logAndAddImpl(
        std::forward<T>(name),
        std::is_integral<typename std::remove_reference<T>::type>()
    );
}
```

如果左值`int`被传入`logAndAdd`，`T`将被推断为`int&`。这不是一个整型类型，因为引用不是整型类型。所以利用`std::remove_reference`移除类型的引用说明符

> [!tip]
>
> 在C++14中，你可以通过`std::remove_reference_t<T>`来简化写法
>
> ```cpp
> template<typename T>
> void logAndAdd(T&& name)
> {
>     //多传递了一个表示形参T是否为整型的实参
>     logAndAddImpl(
>         std::forward<T>(name),
>         std::is_integral<typename std::remove_reference_t<T>>()
>     );
> }
> ```
>

- **`logAndAddImpl`的函数**

> 两个重载函数
>
> 1. 第一个仅用于非整型类型（即`std::is_integral<typename std::remove_reference<T>::type>`是false）：
>
>    ```cpp
>    template<typename T>                            //非整型实参：添加到全局数据结构中
>    void logAndAddImpl(T&& name, std::false_type)	//译者注：高亮std::false_type
>    {
>        auto now = std::chrono::system_clock::now();
>        log(now, "logAndAdd");
>        names.emplace(std::forward<T>(name));
>    }
>    ```
>
>    如果`T`是整型，对象的类型就继承自`std::true_type`，反之继承自`std::false_type`。
>
>    > [!important]
>    >
>    > 概念上，`logAndAdd`传递一个**布尔值**给`logAndAddImpl`表明是否传入了一个整型类型，但是`true`和`false`是**运行时**值，我们需要使用重载决议——**编译时**决策——来选择正确的`logAndAddImpl`重载。
>    >
>    > 标准库提供了这样两个命名`std::true_type`和`std::false_type`分别对应`true和false`
>
> 2. 第二个重载覆盖了相反的场景：当`T`是整型类型。
>
>    ```cpp
>    std::string nameFromIdx(int idx);           //与条款26一样，整型实参：查找名字并用它调用logAndAdd
>    void logAndAddImpl(int idx, std::true_type) //译者注：高亮std::true_type
>    {
>      logAndAdd(nameFromIdx(idx)); 
>    }
>    ```

在这个设计中，类型`std::true_type`和`std::false_type`是“标签”（tag），其唯一目的就是强制重载解析按照我们的想法来执行。

所以没有对这些参数进行命名，以此希望编译器可以意识到这些标签形参没被使用，然后在程序执行时优化掉它们

> [!note]
>
> 通过创建标签对象，在`logAndAdd`内部将重载实现函数的调用“分发”（*dispatch*）给正确的重载。因此这个设计名称为：*tag dispatch*。
>
> **分发函数**——`logAndAdd`——接受一个没有约束的通用引用参数，但是这个函数没有重载。**实现函数**——`logAndAddImpl`——是重载的，一个接受通用引用参数，但是重载规则不仅依赖通用引用形参，还依赖新引入的标签形参，标签值设计来保证有不超过一个的重载是合适的匹配。

---

### 约束使用通用引用的模板

> [!tip]
>
> *tag dispatch*的关键是存在**单独一个函数（没有重载）给客户端API**。这个单独的函数分发给具体的实现函数。

> [!important]
>
> - 第二个问题案例是`Person`类的完美转发构造函数，是个例外。
> - 编译器可能会自行生成拷贝和移动构造函数，
> - 有一些对构造函数的调用也被编译器生成的函数处理，绕过了分发机制。
> - 真正的问题不是编译器生成的函数会绕过*tag dispatch*设计，而是不**总**会绕过去。

> ```cpp
> class Person {
> public:
>  template<typename T>            //完美转发的构造函数
>  explicit Person(T&& n)
>  : name(std::forward<T>(n)) {}
> 
>  explicit Person(int idx);       //int的构造函数
> 
>  Person(const Person& rhs);      //拷贝构造函数（编译器生成）
>  Person(Person&& rhs);           //移动构造函数（编译器生成）
>  …
> };
> 
> Person p("Nancy"); 
> auto cloneOfP(p);                   //从p创建新Person；这通不过编译！
> ```
>
> 提供具有通用引用的构造函数，会使通用引用构造函数在拷贝non-`const`左值时被调用（而不是拷贝构造函数）

- **`std::enable_if`**

  > `std::enable_if`可以给你提供一种强制编译器执行行为的方法，像是特定模板不存在一样。这种模板被称为被**禁止**（disabled）
  >
  > 默认情况下，所有模板是**启用**的（enabled）
  >
  > 使用`std::enable_if`可以使得仅在`std::enable_if`指定的条件满足时模板才启用。
  >
  > 如果传递的类型是`Person`，我们要禁止完美转发构造函数（即让编译器忽略它）
  >
  > ```cpp
  > class Person {
  > public:
  >  template<typename T,
  >           typename = typename std::enable_if<condition>::type>   //译者注：本行高亮，condition为某其他特定条件
  >  explicit Person(T&& n);
  >  …
  > };
  > ```
  >
  > 条件是确认`T`不是`Person`类型
  >
  > ```cpp
  > Person p("Nancy");
  > auto cloneOfP(p);       //用左值初始化
  > ```
  >
  > `T`的类型在通用引用的构造函数中被推导为`Person&`。`Person`和`Person&`类型是不同的
  >
  > > [!warning]
  > >
  > > 精细考虑仅当`T`不是`Person`类型才启用模板构造函数，查看`T`时，应该忽略：
  > >
  > > 1. **是否是个引用**。
  > > 2. **是不是`const`或者`volatile`**。
  > >
  > > 一种方法消除对于`T`的引用，`const`，`volatile`修饰：
  > >
  > > - `std::decay<T>::type`与`T`是相同的，只不过会移除引用和cv限定符（*cv-qualifiers*，即`const`或`volatile`标识符）的修饰。
  > >
  > > > [!tip]
  > > >
  > > > `std::decay`如同其名一样，可以将数组或者函数退化成指针，参考[Item1](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item1.html)
  >
  > 所以`condition`可以为
  >
  > ```cpp
  > !std::is_same<Person, typename std::decay<T>::type>::value
  > 
  >  class Person {
  > public:
  >     template<
  >         typename T,
  >         typename = typename std::enable_if<
  >                        !std::is_same<Person, 
  >                                      typename std::decay<T>::type
  >                                     >::value
  >                    >::type
  >     >
  >     explicit Person(T&& n);
  >     …
  > };
  > ```
  >
  > > [!tip]
  > >
  > > `std::enable_if`
  > >
  > > ```cpp
  > > template< bool B, class T = void >
  > > struct enable_if;
  > > ```
  > >
  > > 若 `B` 为 true，则 `std::enable_if` 拥有等同于 `T` 的公开成员 typedef `type`；否则，无成员 typedef。
  
- 假定从`Person`派生的类以常规方式实现拷贝和移动操作：

  > ```cpp
  > class SpecialPerson: public Person {
  > public:
  >     SpecialPerson(const SpecialPerson& rhs) //拷贝构造函数，调用基类的
  >     : Person(rhs)                           //完美转发构造函数！
  >     { … }
  >     
  >     SpecialPerson(SpecialPerson&& rhs)      //移动构造函数，调用基类的
  >     : Person(std::move(rhs))                //完美转发构造函数！
  >     { … }
  >     
  >     …
  > };
  > ```
  >
  > 而当我们拷贝或者移动一个`SpecialPerson`对象时，我们**希望调用**基类对应的拷贝和移动构造函数，来拷贝或者移动基类部分
  >
  > 现在我们意识到不只是禁止`Person`类型启用模板构造函数，而是禁止`Person`**以及任何派生自`Person`**的类型启用模板构造函数。
  >
  > 标准库中也有*type trait*判断一个类型是否继承自另一个类: `  std::is_base_of<T1, T2>`
  >
  > > [!tip]
  > >
  > > `std::is_base_of<T1, T2>`是true就表示`T2`派生自`T1`。
  >
  > 修正控制`Person`完美转发构造函数的启用条件:
  > ```cpp
  > //C++11
  > class Person {
  > public:
  >     template<
  >         typename T,
  >         typename = typename std::enable_if<
  >                        !std::is_base_of<Person, 
  >                                         typename std::decay<T>::type
  >                                        >::value
  >                    >::type
  >     >
  >     explicit Person(T&& n);
  >     …
  > };
  > 
  > //C++14
  > class Person  {                                         //C++14
  > public:
  >     template<
  >         typename T,
  >         typename = std::enable_if_t<                    //这儿更少的代码
  >                        !std::is_base_of<Person,
  >                                         std::decay_t<T> //还有这儿
  >                                        >::value
  >                    >                                    //还有这儿
  >     >
  >     explicit Person(T&& n);
  >     …
  > };
  > ```

- 应用于**区分整型参数和非整型参数**。我们的原始目标是解决构造函数模糊性问题。

  > （1）加入一个`Person`构造函数重载来处理整型参数；
  >
  > （2）约束模板构造函数使其对于某些实参禁用。
  >
  > ```cpp
  > class Person {
  > public:
  >     template<
  >         typename T,
  >         typename = std::enable_if_t<
  >             !std::is_base_of<Person, std::decay_t<T>>::value
  >             &&
  >             !std::is_integral<std::remove_reference_t<T>>::value
  >         >
  >     >
  >     explicit Person(T&& n)          //对于std::strings和可转化为
  >     : name(std::forward<T>(n))      //std::strings的实参的构造函数
  >     { … }
  > 
  >     explicit Person(int idx)        //对于整型实参的构造函数
  >     : name(nameFromIdx(idx))
  >     { … }
  > 
  >     …                               //拷贝、移动构造函数等
  > 
  > private:
  >     std::string name;
  > };
  > ```

***



### **折中**

> [!important]
>
> 通常，**完美转发更有效率**，因为它避免了仅仅去为了符合形参声明的类型而创建临时对象。
>
> 完美转发也有缺点。即使某些类型的实参可以传递给接受特定类型的函数，也无法完美转发。。[Item30](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html)中探索了完美转发失败的例子。
>
> 第二个问题是当客户传递**无效参数**时错误消息的可理解性。

- 假如客户传递了一个由`char16_t`（一种C++11引入的类型表示16位字符）来创建一个`Person`对象：

  > ```cpp
  > Person p(u"Konrad Zuse");   //“Konrad Zuse”由const char16_t类型字符组成
  > ```
  >
  > 本条款前三种方法，编译器将看到可用的采用`int`或者`std::string`的构造函数，会产生错误消息，表示没有可以从`const char16_t[12]`转换为`int`或者`std::string`的方法。
  >
  > 基于完美转发的方法，`const char16_t`不受约束地绑定到构造函数的形参。

- 在`Person`这个例子中，我们知道完美转发函数的通用引用形参要作为`std::string`的初始化器，所以我们可以用`static_assert`来确认它可以起这个作用。

  > `std::is_constructible`这个*type trait*执行编译时测试，确定一个类型的对象是否可以用另一个不同类型（或多个类型）的对象（或多个对象）来构造
  >
  > ```cpp
  > class Person {
  > public:
  >     template<                       //同之前一样
  >         typename T,
  >         typename = std::enable_if_t<
  >             !std::is_base_of<Person, std::decay_t<T>>::value
  >             &&
  >             !std::is_integral<std::remove_reference_t<T>>::value
  >         >
  >     >
  >     explicit Person(T&& n)
  >     : name(std::forward<T>(n))
  >     {
  >         //断言可以用T对象创建std::string
  >         static_assert(
  >         std::is_constructible<std::string, T>::value,
  >         "Parameter n can't be used to construct a std::string"
  >         );
  > 
  >         …               //通常的构造函数的工作写在这
  > 
  >     }
  >     
  >     …                   //Person类的其他东西（同之前一样）
  > };
  > ```
  >
  > 客户代码尝试使用无法构造`std::string`的类型创建`Person`，会导致指定的错误消息。

### 总结

> [!note]
>
> - 通用引用和重载的组合替代方案包括使用不同的函数名，通过lvalue-reference-to-`const`传递形参，按值传递形参，使用*tag dispatch*。
> - 通过`std::enable_if`约束模板，允许组合通用引用和重载使用，但它也控制了编译器在哪种条件下才使用通用引用重载。
> - 通用引用参数通常具有高效率的优势，但是可用性就值得斟酌。

---



## **Item 28: Understand reference collapsing**

### 通用引用和对左值右值的编码

- 不管传给param的实参是**左值还是右值**，模板形参`T`都会编码。

  > ```cpp
  > template<typename T>
  > void func(T&& param);
  > ```
  >
  > 1. 当左值实参被传入时，`T`被推导为左值引用。
  > 2. 当右值被传入时，`T`被推导为**非引用**。
  >
  > > [!warning]
  > >
  > > 注意不对称性：左值被编码为左值引用，右值被编码为**非引用**。
  >
  > ```cpp
  > Widget widgetFactory();     //返回右值的函数
  > Widget w;                   //一个变量（左值）
  > func(w);                    //用左值调用func；T被推导为Widget&
  > func(widgetFactory());      //用右值调用func；T被推导为Widget
  > ```
  >
  > 一个是左值，一个是右值，模板形参`T`被推导为不同的类型
  >
  > 这决定了通用引用成为左值还是右值，也是`std::forward`的工作基础。

> [!warning]
>
> 在C++中**引用的引用**是非法的
>
> ```cpp
> int x;
> auto& & rx = x;             //错误！不能声明引用的引用
> ```

- 一个左值传给接受通用引用的模板函数会发生什么：

  > ```cpp
  > template<typename T>
  > void func(T&& param);       //同之前一样
  > 
  > func(w);                    //用左值调用func；T被推导为Widget&
  > ```
  >
  > 如果我们用`T`推导出来的类型（即`Widget&`）初始化模板
  >
  > ```cpp
  > void func(Widget& && param);//引用的引用，但是编译器没有报错
  > ```
  >
  > `param`的类型应该为左值引用，而最终的函数签名也变成了
  >
  > ```cpp
  > void func(Widget& param);
  > ```
  >
  > 编译器通过**引用折叠**（*reference collapsing*）实现禁止声明引用的引用。

---

### **引用折叠**（*reference collapsing*）

> [!important]
>
> **引用折叠**（*reference collapsing*）禁止**你**声明引用的引用，但是**编译器**会在特定的上下文中产生这些，模板实例化就是其中一种情况。

- 当编译器生成引用的引用时，引用折叠指导下一步发生什么。

  > > [!tip]
  > >
  > > 存在两种类型的引用（左值和右值）
  > >
  > > 所以有**四种可能的引用组合**（左值的左值，左值的右值，右值的右值，右值的左值）
  >
  > 如果一个上下文中允许引用的引用存在（比如，模板的实例化），引用根据规则**折叠**为单个引用：
  >
  > > [!note]
  > >
  > > 如果任一引用为左值引用，则结果为左值引用。否则（即，如果引用都是右值引用），结果为右值引用。

- 引用折叠是`std::forward`工作的一种关键机制。

  > ```cpp
  > template<typename T>
  > void f(T&& fParam)
  > {
  >     …                                   //做些工作
  >     someFunc(std::forward<T>(fParam));  //转发fParam到someFunc
  > }
  > ```
  >
  > `std::forward`的作用是当且仅当传给`f`的实参为右值时，即`T`为非引用类型，才将`fParam`（左值）转化为一个右值。
  >
  > 所以`std::forward`可以这样实现：
  >
  > ```cpp
  > 
  > 
  > ////不是标准库版本的实现（忽略了一些接口描述）
  > template<typename T>                                //在std命名空间
  > T&& forward(typename
  >                 remove_reference<T>::type& param)
  > {
  >     return static_cast<T&&>(param);
  > }
  > 
  > //在C++14中，std::remove_reference_t的存在使得实现变得更简洁：
  > template<typename T>                        //C++14；仍然在std命名空间
  > T&& forward(remove_reference_t<T>& param)
  > {
  >   return static_cast<T&&>(param);
  > }
  > ```

- 引用折叠发生在四种情况下。

  > 1. 第一，也是最常见的就是**模板实例化**。
  >
  > 2. 第二，是**`auto`变量的类型生成**，具体细节类似于模板，因为`auto`变量的类型推导基本与模板类型推导雷同（参见[Item2](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item2.html)）。
  >
  >    ```cpp
  >    Widget widgetFactory();     //返回右值的函数
  >    Widget w;                   //一个变量（左值）
  >    auto&& w1 = w;
  >    //左值初始化w1，因此为auto推导出类型Widget&
  >    //产生了引用的引用 Widget& && w1 = w;发生引用折叠
  >    //结果就是w1是一个左值引用。Widget& w1 = w
  >                
  >    auto&& w2 = widgetFactory();
  >    //右值初始化w2，auto推导出非引用类型Widget。代入auto得到：
  >    //Widget&& w2 = widgetFactory()最终结果，w2是个右值引用。
  >    ```
  >
  > > [!important]
  > >
  > > 通用引用不是一种新的引用，它实际上是满足以下两个条件下的**右值引用**：
  > >
  > > - **类型推导区分左值和右值**。`T`类型的左值被推导为`T&`类型，`T`类型的右值被推导为`T`。
  > > - **发生引用折叠**。
  >
  > 3. 第三种情况是`typedef`和别名声明的产生和使用中（参见[Item9](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item9.html)）。
  >
  >    在创建或者评估`typedef`过程中出现了引用的引用，则引用折叠就会起作用。
  >
  >    ```cpp
  >    template<typename T>
  >    class Widget {
  >    public:
  >        typedef T&& RvalueRefToT;
  >        …
  >    };
  >    
  >    //使用左值引用实例化Widget
  >    Widget<int&> w;
  >    //typedef int& && RvalueRefToT;引用折叠后
  >    //typedef int& RvalueRefToT;
  >    ```
  >
  > 4. 最后一种引用折叠发生的情况是，`decltype`使用的情况。
  >
  >    分析`decltype`期间，出现了**引用的引用**，引用折叠规则就会起作用（关于`decltype`，参见[Item3](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item3.html)）

---

### 总结

> [!note]
>
> - 引用折叠发生在四种情况下：**模板实例化，`auto`类型推导，`typedef`与别名声明的创建和使用，`decltype`**。
> - 当编译器在引用折叠环境中生成了引用的引用时，结果就是单个引用。有左值引用折叠结果就是左值引用，否则就是右值引用。
> - 通用引用就是在**特定上下文的右值引用**，上下文是通过类型推导区分左值还是右值，并且发生引用折叠的那些地方。

---



## **Item 29: Assume that move operations are not present, not cheap, and not used**

### **移动语义**

- 移动语义可以说是C++11最主要的特性。
- 它不仅允许编译器使用开销小的移动操作**代替**大开销的复制操作，而且默认这么做（当特定条件满足的时候）。

> [!warning]
>
> 移动语义确实可以做这些事，这把这个特性封为一代传说。
>
> 这个条款的目的就是给你泼一瓢冷水，**保持理智**看待移动语义。

---

### "冷水"

- 已知很多类型不支持移动操作

  > 对于你的应用中（或者代码库中）的类型，**没有适配C++11**的部分，编译器即使支持移动语义也是无能为力的。
  >
  > C++11倾向于为缺少移动操作的类生成它们，但是只有在**没有声明复制操作，移动操作，或析构函数的类**中才会生成移动操作（参考[Item17](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item17.html)）。
  >
  > 对于没有明确支持移动操作的类型，并且不符合编译器默认生成的条件的类，没有理由期望C++11会比C++98进行任何性能上的提升。

- 显式支持了移动操作，结果可能也没有你希望的那么好。

  > 认为移动所有容器的**开销都非常小**是个错误
  >
  > 对于某些容器来说，压根就**不存在开销小**的方式来移动它所包含的内容。
  >
  > 对另一些容器来说，容器的开销真正小的移动操作会有有些容器元素不能满足的注意条件。
  
- `std::array`，这是C++11中的新容器。

  > `std::array`本质上是具有STL接口的**内置数组**。
  >
  > 存储具体数据在堆内存的容器，本身只保存了指向堆内存中容器内容的**指针**（真正实现更复杂一些，但基本逻辑就是这样）。
  >
  > 指针的存在使得在常数时间移动整个容器成为可能，只需要从**源容器**拷贝保存指向容器内容的指针到**目标容器**，然后将源指针置为空指针就可以了：
  >
  > ```cpp
  > std::vector<Widget> vw1;
  > //把数据存进vw1
  > …
  > //把vw1移动到vw2。以常数时间运行。只有vw1和vw2中的指针被改变
  > auto vw2 = std::move(vw1);
  > ```
  >
  > ![item29_fig1](D:\Internt_of_Thing\e_book\C++\note\Effective-Modern-C++\assets\item29_fig1.png)
  >
  > 但是`std::array`没有这种指针实现，数据就保存在`std::array`对象中：
  >
  > ```cpp
  > std::array<Widget, 10000> aw1;
  > //把数据存进aw1
  > …
  > //把aw1移动到aw2。以线性时间运行。aw1中所有元素被移动到aw2
  > auto aw2 = std::move(aw1);
  > ```
  >
  > ![item29_fig2](D:\Internt_of_Thing\e_book\C++\note\Effective-Modern-C++\assets\item29_fig2.png)
  >
  > 使用`std::array`的移动操作还是复制操作都将花费线性时间的开销，因为每个容器中的元素终归需要拷贝或移动一次

- 另一方面，`std::string`提供了常数时间的移动操作和线性时间的复制操作。

  > [!warning]
  >
  > 但是**可能不一定**。
  >
  > 许多字符串的实现采用了小字符串优化（*small string optimization*，SSO）。
  >
  > “小”字符串（比如长度小于15个字符的）存储在了`std::string`的**缓冲区**中，并没有存储在堆内存
  >
  > 移动这种存储的字符串并不比复制操作更快。


---



### 移动语义并无优势?

即使对于支持快速移动操作的类型，某些看似可靠的移动操作最终也会导致复制。

> [Item14](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item14.html)解释了原因，标准库中的某些容器操作提供了强大的**异常安全保证**，确保依赖那些保证的C++98的代码在升级到C++11且仅当移动操作不会抛出异常，从而可能替换操作时，不会不可运行。
>
> 结果就是，即使类提供了更具效率的移动操作，而且即使移动操作更合适（比如源对象是右值），编译器仍可能被迫使用复制操作，因为**移动操作没有声明`noexcept`**。

存在几种情况，C++11的移动语义并无优势：

> - **没有移动操作**：要移动的对象没有提供移动操作，所以移动的写法也会变成复制操作。
> - **移动不会更快**：要移动的对象提供的移动操作并不比复制速度更快。
> - **移动不可用**：进行移动的上下文要求移动操作不会抛出异常，但是该操作没有被声明为`noexcept`。
>
> 值得一提的是，还有另一个场景，会使得移动并没有那么有效率：
>
> - **源对象是左值**：除了极少数的情况外（例如[Item25](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item25.html)），只有右值可以作为移动操作的来源。

> [!important]
>
> 但是，通常，你**了解你代码里使用的类型，依赖他们的特性不变性**（比如是否支持快速移动操作）。
>
> 这种情况，你无需这个条款的假设，只需要查找所用类型的移动操作详细信息。
>
> 如果类型提供了快速移动操作，并且在调用移动操作的上下文中使用对象，可以安全的使用快速移动操作替换复制操作。

---

### 总结

> [!note]
>
> - 假定移动操作不存在，成本高，未被使用。
> - 在已知的类型或者支持移动语义的代码中，就不需要上面的假设。

---

## **Item 30: Familiarize yourself with perfect forwarding failure cases**

### **完美转发**

C++11最显眼的功能之一就是完美转发功能。

- “完美转发”的含义:

  > [!note]
  >
  > “转发”仅表示将一个函数的形参传递——就是**转发**——给另一个函数。
  >
  > 对于第二个函数（被传递的那个）目标是收到与第一个函数（执行传递的那个）完全相同的对象。

- 这规则排除了**按值传递的形参**，因为它们是原始调用者传入内容的**拷贝**。

- **指针形参**也被排除在外，因为我们不想强迫调用者传入指针。

  > [!important]
  >
  > 关于通常目的的转发，我们将处理**引用**形参。
  >
  > **完美转发**（*perfect forwarding*）意味不仅转发对象，还转发显著的特征：类型，是**左值还是右值**，是**`const`还是`volatile`**。
  >
  > 将使用**通用引用**（参见[Item24](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item24.html)），因为通用引用形参被传入实参时才确定是左值还是右值。

- 有一些函数`f`，然后想编写一个转发给它的函数

  > ```cpp
  > template<typename T>
  > void fwd(T&& param)             //接受任何实参
  > {
  >     f(std::forward<T>(param));  //转发给f
  > }
  > ```
  >
  > 从本质上说，转发函数是通用的。例如`fwd`模板，接受**任何类型**的实参，并转发得到的任何东西。
  >
  > `fwd`的可变形式如下：
  >
  > ```cpp
  > template<typename... Ts>
  > void fwd(Ts&&... params)            //接受任何实参
  > {
  >     f(std::forward<Ts>(params)...); //转发给f
  > }
  > ```
  >
  > 转发函数不仅是模板，而且是可变模板，因此可以接受**任何数量**的实参

---

### 无法做到完美转发的实参类型

> [!warning]
>
> 如果`f`使用某**特定实参**会执行某个操作，但是`fwd`使用相同的实参会执行不同的操作，完美转发就会失败
>
> ```cpp
> f( expression );        //调用f执行某个操作
> fwd( expression );		//但调用fwd执行另一个操作，则fwd不能完美转发expression给f
> ```
>
> 或者模板类型推导失败，完美转发会失败。

#### [花括号初始化器](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html#花括号初始化器)

假定`f`这样声明：

```cpp
void f(const std::vector<int>& v);

//用花括号初始化调用
f({ 1, 2, 3 });         //可以，“{1, 2, 3}”隐式转换为std::vector<int>

//传递相同的列表初始化给fwd不能编译
fwd({ 1, 2, 3 });       //错误！不能编译
```

这是因为这是完美转发失效的一种情况。所有这种错误有相同的原因。

当通过调用函数模板`fwd`间接调用`f`时，编译器**推导**传入给`fwd`的实参类型，然后比较推导后的实参类型和`f`的形参声明类型。当下面情况任何一个发生时，完美转发就会失败：

> [!important]
>
> - **编译器不能推导出`fwd`的一个或者多个形参类型。** 这种情况下代码无法编译。
> - **编译器推导“错”了`fwd`的一个或者多个形参类型。** 在这里，“错误”可能意味着`fwd`的实例将无法使用推导出的类型进行编译，但是也可能意味着使用`fwd`的推导类型调用`f`，与用传给`fwd`的实参直接调用`f`表现出不一致的行为。这种不同行为的原因可能是因为`f`是个重载函数的名字，并且由于是“不正确的”类型推导，在`fwd`内部调用的`f`重载和直接调用的`f`重载不一样。

- 在上面的`fwd({ 1, 2, 3 })`例子中

  > 问题在于，将花括号初始化传递给未声明为`std::initializer_list`的函数模板形参，被判定为“非推导上下文”。意味着编译器不准在对`fwd`的调用中推导表达式`{ 1, 2, 3 }`的类型
  >
  > 一种简单的解决方法——使用**`auto`声明一个局部变量**，然后将局部变量传进转发函数：
  >
  > ```cpp
  > auto il = { 1, 2, 3 };  //il的类型被推导为std::initializer_list<int>
  > fwd(il);                //可以，完美转发il给f
  > ```

#### [`0`或者`NULL`作为空指针](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html#0或者null作为空指针)

> [!important]
>
> [Item8](https://cntransgroup.github.io/EffectiveModernCppChinese/3.MovingToModernCpp/item8.html)说明当你试图传递**`0`或者`NULL`作为空指针**给模板时，类型推导会出错，会把传来的实参推导为一个**整型**类型（典型情况为`int`）而不是指针类型。
>
> 解决方法非常简单，传一个`nullptr`而不是`0`或者`NULL`。

#### [仅有声明的整型`static const`数据成员](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html#仅有声明的整型static-const数据成员)

> [!important]
>
> 通常，无需在类中定义整型`static const`数据成员
>
> 声明就可以了。这是因为编译器会对此类成员实行**常量传播**（*const propagation*），因此消除了保留内存的需要。
>
> > [!tip]
> >
> > **常量传播**（*const propagation*）
> >
> > 代码中存在被声明为常量（const）的值时，编译器会尝试将这些常量值直接**替换**到它们被使用的地方，而不是在运行时去访问存储这些常量值的内存位置。
>
> ```cpp
> class Widget {
> public:
>     static const std::size_t MinVals = 28;  //MinVal的声明
>     …
> };
> …                                           //没有MinVals定义
> 
> std::vector<int> widgetData;
> widgetData.reserve(Widget::MinVals);        //使用MinVals
> ```
>
> 译器通过将值28放入所有提到`MinVals`的位置来补充缺少的定义（就像它们被要求的那样）
>
> 上面的代码仍然可以编译，但是链接时就会报错，直到为`MinVals`提供定义

- 想象下`f`（`fwd`要转发实参给它的那个函数）这样声明：

  > ```cpp
  > void f(std::size_t val);
  > //使用MinVals调用f是可以的，因为编译器直接将值28代替MinVals：
  > f(Widget::MinVals);         //可以，视为“f(28)”
  > //尝试通过fwd调用f
  > fwd(Widget::MinVals);       //错误！不应该链接
  > ```
  >
  > 底层的问题是一样的。
  >
  > 代码中没有使用`MinVals`的地址，但是`fwd`的形参是通用引用，而引用，在编译器生成的代码中，**通常被视作指针**。
  >
  > > [!tip]
  > >
  > > 在程序的二进制底层代码中（以及硬件中）指针和引用是一样的。在这个水平上，引用只是可以**自动解引用**的指针。
  >
  > 通过引用传递`MinVals`实际上与通过指针传递`MinVals`是一样的，因此，必须有内存使得指针可以指向。

- 通过引用传递的整型`static const`数据成员，通常需要**定义**它们，这个要求可能会造成在不使用完美转发的代码成功的地方，使用等效的完美转发失败。（译者注：这里意思应该是没有定义，完美转发就会失败）

> [!warning]
>
> 根据标准，通过引用传递`MinVals`要求有定义。
>
> 但不是所有的实现都强制要求这一点。

#### [重载函数的名称和模板名称](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html#重载函数的名称和模板名称)

函数`f`（我们想通过`fwd`完美转发实参给的那个函数）可以通过向其传递**执行某些功能的函数**来自定义其行为。

> ```cpp
> //函数接受和返回值都是int
> void f(int (*pf)(int));             //pf = “process function”
> 
> //也可以使用更简单的非指针语法声明
> void f(int pf(int));                //与上面定义相同的f
> ```
>
> 假设我们有了一个重载函数
>
> ```cpp
> int processVal(int value);
> int processVal(int value, int priority);
> 
> //传递processVal给f
> f(processVal);                      //可以
> ```
>
> `f`要求一个函数指针作为实参，但是`processVal`不是一个函数指针或者一个函数，它是同名的两个不同函数。但是，编译器可以知道它需要哪个：**匹配上`f`的形参类型的那个**。
>
> `fwd`是一个函数模板，**没有它可接受的类型的信息**，使得编译器不可能决定出哪个函数应被传递：
>
> ```cpp
> fwd(processVal);                    //错误！那个processVal？
> ```
>
> 单用`processVal`是没有类型信息的，所以就不能类型推导，完美转发失败。

- 试图使用**函数模板**而不是（或者也加上）重载函数的名字，同样的问题也会发生。

  > 一个函数模板不代表单独一个函数，它表示一个**函数族**：
  >
  > ```cpp
  > template<typename T>
  > T workOnVal(T param)                //处理值的模板
  > { … }
  > 
  > fwd(workOnVal);                     //错误！哪个workOnVal实例？
  > ```

- 要让像`fwd`的完美转发函数接受一个重载函数名或者模板名，方法是**指定**要转发的那个重载或者实例。

  > 创造与`f`相同形参类型的函数指针，通过`processVal`或者`workOnVal`实例化这个函数指针
  >
  > ```cpp
  > using ProcessFuncType =                         //写个类型定义；见条款9
  >     int (*)(int);
  > 
  > ProcessFuncType processValPtr = processVal;     //指定所需的processVal签名
  > 
  > fwd(processValPtr);                             //可以
  > fwd(static_cast<ProcessFuncType>(workOnVal));   //也可以
  > ```
  >
  > 这要求你知道`fwd`转发的函数指针的类型。

#### [位域](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html#位域)

完美转发最后一种失败的情况是函数实参使用**位域**这种类型。

IPv4的头部有如下模型：

```cpp
struct IPv4Header {
    std::uint32_t version:4,
                  IHL:4,
                  DSCP:6,
                  ECN:2,
                  totalLength:16;
    …
};
```

`f`（转发函数`fwd`的目标）为接收一个`std::size_t`的形参，则使用`IPv4Header`对象的`totalLength`字段进行调用没有问题：

```cpp
void f(std::size_t sz);         //要调用的函数

IPv4Header h;
…
f(h.totalLength);               //可以

//通过fwd转发
fwd(h.totalLength);             //错误！
```

问题在于`fwd`的形参是引用，而`h.totalLength`是non-`const`位域。

> [!warning]
>
> C++标准非常清楚地谴责了这种组合：**non-`const`引用不应该绑定到位域。**
>
> 禁止的理由很充分。位域可能包含了机器字的任意部分（比如32位`int`的3-5位），但是这些东西**无法直接寻址**。

- 一旦意识到接收位域实参的函数都将接收位域的**副本**，就可以轻松解决位域不能完美转发的问题。

  > 没有函数可以绑定引用到位域，也没有函数可以接受指向位域的指针
  >
  > 位域可以传给的形参种类只有按值传递的形参

> [!tip]
>
> 传reference-to-`const`形参的情况中，标准要求这个引用实际上绑定到存放位域值的副本对象
>
> 但是eference-to-`const`不直接绑定到位域，而是绑定位域值拷贝到的一个**普通对象**。

可以自己创建副本然后利用副本调用完美转发。在`IPv4Header`的例子中，可以如下写法：

```cpp
//拷贝位域值；参看条款6了解关于初始化形式的信息
auto length = static_cast<std::uint16_t>(h.totalLength);

fwd(length);                    //转发这个副本
```



---

### 总结

大多数情况下，完美转发工作的很好。你基本不用考虑其他问题。

> [!note]
>
> - 当模板类型推导失败或者推导出错误类型，完美转发会失败。
> - 导致完美转发失败的实参种类有**花括号初始化**，**作为空指针的`0`或者`NULL`**，仅有**声明的整型`static const`**数据成员，**模板和重载函数**的名字，**位域**。

---

