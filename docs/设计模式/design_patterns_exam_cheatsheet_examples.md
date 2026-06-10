# 设计模式考试纸质速查表（模式识别 + UML + 意图 + 关键代码）

> 适用题型：给定场景，识别模式，画 UML 类图，说明设计意图，写关键代码。  
> 不包含：享元、迭代器、访问者、解释器。代码均为“伪 Java 骨架”，考试时按题目类名替换即可。  
> 本版增加“生活例子 / 考题套话”，用于纸质考试时快速识别场景。

---

## 0. 考场答题通用模板

### 0.1 识别模式的 4 步
1. 找变化点：对象创建变化？接口不兼容？树形结构？算法可替换？对象状态变化？请求要排队/撤销？
2. 定抽象层：先写接口/抽象类，如 Product、Strategy、Component、Subject。
3. 分配角色：抽象角色 + 具体角色 + 客户端/上下文/工厂/装饰器/代理/接收者等。
4. 说明原则：开闭原则、依赖倒置、单一职责、组合优于继承、迪米特原则。

### 0.2 答题段落模板
本题适合使用【X 模式】。因为场景中存在【变化点/问题】，若直接在客户端使用 if-else/new/类型判断，会导致系统与具体类强耦合，新增功能需要修改原有代码。该模式通过引入【抽象角色】和【协作角色】，将【变化部分】封装起来，使客户端依赖抽象而非具体实现，符合开闭原则和依赖倒置原则。

### 0.3 UML 关系速记
- 依赖：虚线箭头 A ..> B，A 临时使用 B，如方法参数/局部变量。
- 关联：实线 A --> B，A 持有 B 成员引用。
- 聚合：空心菱形在整体端，整体管理部分，部分可独立存在。
- 组合：实心菱形在整体端，整体与部分同生共死。
- 泛化：实线空心三角箭头指向父类。
- 实现：虚线空心三角箭头指向接口。

---

## 1. 面向对象设计原则速记

| 原则 | 一句话 | 理解例子 | 考试套话 |
|---|---|---|---|
| 单一职责 SRP | 一个类只负责一类变化 | `Student` 只管学生信息，成绩统计交给 `ScoreService`，报表导出交给 `ReportExporter`。 | 避免一个类承担过多职责，降低修改影响范围。 |
| 开闭原则 OCP | 对扩展开放，对修改关闭 | 新增“三角形绘制”时新增 `Triangle implements Shape`，不修改原来的 `drawShapes()`。 | 新需求通过新增类/实现扩展，而不是修改稳定代码。 |
| 里氏替换 LSP | 子类能透明替换父类 | `Bird` 有 `fly()` 不合适，因为企鹅不能飞；应拆成 `Flyable` 接口。 | 继承要保证行为一致，不要破坏父类约定。 |
| 依赖倒置 DIP | 依赖抽象，不依赖具体 | `OrderService` 依赖 `Payment` 接口，而不是直接依赖 `AliPay`。 | 高层模块和低层模块都面向接口编程。 |
| 接口隔离 ISP | 接口小而专一 | 打印机接口拆成 `Printable`、`Scannable`，普通打印机不用实现扫描。 | 不强迫类依赖它不需要的方法。 |
| 迪米特 LoD | 只和直接朋友通信 | 用户只找“前台”办理入住，不直接找保洁、财务、仓库。 | 减少对象间直接耦合，不要“朋友的朋友”。 |
| 合成复用 CARP | 多用组合，少用继承 | 汽车“有一个”发动机，用 `Car` 持有 `Engine`，不要让 `Car extends Engine`。 | 用“拥有 has-a”复用功能，避免继承滥用。 |

---

## 2. 模式识别总表

| 问题信号 | 优先模式 |
|---|---|
| 根据参数创建不同产品，产品少、变化少 | 简单工厂 |
| 产品经常新增，希望新增产品不改工厂核心 | 工厂方法 |
| 创建一组相关对象，同一品牌/风格/数据库族 | 抽象工厂 |
| 复杂对象分步骤构建，构建过程相同但表示不同 | 建造者 |
| 复制已有复杂对象，创建成本高 | 原型 |
| 全局唯一对象：配置、日志、连接池 | 单例 |
| 老接口和新接口不兼容，需要复用旧类 | 适配器 |
| 两个独立变化维度，避免类爆炸 | 桥接 |
| 树形结构，统一处理叶子与容器 | 组合 |
| 运行时动态增加职责，可多层叠加 | 装饰 |
| 子系统复杂，需要统一入口 | 外观 |
| 控制访问：权限、远程、缓存、延迟加载 | 代理 |
| 多种算法可替换 | 策略 |
| 算法流程固定，部分步骤由子类实现 | 模板方法 |
| 一对多通知，发布-订阅 | 观察者 |
| 请求封装成对象，支持队列、日志、撤销 | 命令 |
| 多个处理者按链传递请求 | 职责链 |
| 对象行为随内部状态改变 | 状态 |
| 多对象网状通信复杂，交给中心协调 | 中介者 |
| 保存并恢复对象历史状态 | 备忘录 |

### 2.1 生活例子速判表

| 场景例子 | 优先想到 |
|---|---|
| 输入“圆形/方形”创建按钮，产品少 | 简单工厂 |
| 日志系统新增文件日志、数据库日志，每种日志一个工厂 | 工厂方法 |
| Windows 风格按钮+文本框、Mac 风格按钮+文本框 | 抽象工厂 |
| 组装电脑：CPU、内存、硬盘、显卡一步步配置 | 建造者 |
| 游戏中复制大量相似敌人/地图对象 | 原型 |
| 系统配置、日志记录器、连接池只有一个 | 单例 |
| 旧接口 `playMp3()`，新系统要求 `play()` | 适配器 |
| 消息类型（普通/加急） × 发送渠道（短信/邮件） | 桥接 |
| 文件夹和文件都可以执行 `show()` / `getSize()` | 组合 |
| 咖啡加奶、加糖、加巧克力，可叠加 | 装饰 |
| 一键加密文件：读取、加密、保存由门面统一调用 | 外观 |
| 图片懒加载、权限校验、远程对象本地代表 | 代理 |
| 不同支付方式、不同排序算法、不同折扣算法 | 策略 |
| 做菜流程固定：备菜-烹饪-装盘，具体菜不同 | 模板方法 |
| 公众号发文后所有订阅者收到通知 | 观察者 |
| 遥控器按钮封装“开灯/关灯/撤销”命令 | 命令 |
| 报销审批：组长-经理-总监-校长逐级处理 | 职责链 |
| 订单：待支付、已支付、已发货、已完成行为不同 | 状态 |
| 聊天室中用户不直接互发，由聊天室转发 | 中介者 |
| 文本编辑器撤销、游戏存档恢复 | 备忘录 |

---

# 3. 创建型模式

## 3.1 简单工厂 Simple Factory

**识别**：客户端根据 type/new 创建不同产品；产品种类少，变化不频繁。  
**理解例子**：一个按钮库根据字符串 `"circle"/"rect"` 创建圆形按钮或矩形按钮；考试里看到“根据参数创建不同对象”先想到它。  
**意图**：封装创建逻辑，客户端只依赖 Product。  
**UML**：Factory -> Product；ConcreteProductA/B 实现 Product。

```java
interface Product { void operation(); }
class ProductA implements Product { public void operation(){} }
class ProductB implements Product { public void operation(){} }
class Factory {
  static Product create(String type) {
    if ("A".equals(type)) return new ProductA();
    if ("B".equals(type)) return new ProductB();
    throw new RuntimeException();
  }
}
```

**优点**：客户端无需知道具体类；创建集中。  
**缺点**：新增产品要改 Factory，违反开闭原则。
**答题例句**：把 `new ProductA()`、`new ProductB()` 集中到工厂中，客户端只拿到 `Product`，但产品变化频繁时应升级为工厂方法。

## 3.2 工厂方法 Factory Method

**识别**：产品扩展频繁，希望新增产品不改已有工厂；“一个产品一个工厂”。  
**理解例子**：日志系统中 `FileLoggerFactory` 创建文件日志，`DBLoggerFactory` 创建数据库日志；新增云日志只新增 `CloudLoggerFactory`。  
**意图**：定义创建对象接口，让子类决定实例化哪个产品。  
**UML**：Product <- ConcreteProduct；Factory <- ConcreteFactory；ConcreteFactory 创建 ConcreteProduct。

```java
interface Product { void operation(); }
class ProductA implements Product { public void operation(){} }
abstract class Factory { abstract Product create(); }
class FactoryA extends Factory {
  Product create() { return new ProductA(); }
}
```

**优点**：符合开闭原则、单一职责。  
**缺点**：类数量增加。
**答题例句**：把原来简单工厂中的条件分支拆到各个具体工厂中，新增产品只新增产品类和工厂类。

## 3.3 抽象工厂 Abstract Factory

**识别**：需要创建“一组相关对象”，如海尔电视+海尔空调、Windows 按钮+文本框。  
**理解例子**：皮肤主题系统中，`WindowsFactory` 同时创建 Windows 按钮和文本框，`MacFactory` 同时创建 Mac 按钮和文本框，保证风格统一。  
**核心概念**：产品等级结构 = TV/AC；产品族 = HaierTV+HaierAC。  
**UML**：AbstractFactory 有 createA/createB；ConcreteFactory1 创建 ProductA1/ProductB1。

```java
interface ProductA { void a(); }
interface ProductB { void b(); }
interface Factory { ProductA createA(); ProductB createB(); }
class Factory1 implements Factory {
  public ProductA createA(){ return new ProductA1(); }
  public ProductB createB(){ return new ProductB1(); }
}
```

**优点**：保证同一产品族一致；切换产品族方便。  
**缺点**：新增产品等级结构困难，要改所有工厂接口。
**答题例句**：一个具体工厂负责一个产品族，适合“成套创建”，但如果新增产品种类如 `createMenu()`，所有工厂都要改。

## 3.4 建造者 Builder

**识别**：对象复杂，包含很多部件/参数；构建步骤稳定，但每步实现不同。  
**理解例子**：组装电脑需要 CPU、内存、硬盘、显卡；办公电脑和游戏电脑的装配步骤类似，但具体部件不同。  
**意图**：分离复杂对象的构建过程和表示。  
**UML**：Director 使用 Builder；ConcreteBuilder 构造 Product。

```java
class Product { void setA(String a){} void setB(String b){} }
interface Builder { void buildA(); void buildB(); Product getResult(); }
class Builder1 implements Builder {
  private Product p = new Product();
  public void buildA(){ p.setA("A1"); }
  public void buildB(){ p.setB("B1"); }
  public Product getResult(){ return p; }
}
class Director {
  Product construct(Builder b){ b.buildA(); b.buildB(); return b.getResult(); }
}
```

**易混**：抽象工厂创建一族产品；建造者一步步组装一个复杂产品。
**答题例句**：把复杂对象的“构建步骤”交给 Director，把每一步的具体实现交给 Builder。

## 3.5 原型 Prototype

**识别**：大量相似对象；创建成本高；希望通过复制已有对象得到新对象。  
**理解例子**：游戏中敌人对象初始化很复杂，先创建一个“敌人原型”，后续通过 clone 快速复制，再改位置和血量。  
**意图**：用原型实例指定对象种类，通过 clone 创建新对象。  
**UML**：Prototype 定义 clone；ConcretePrototype 实现 clone。

```java
interface Prototype { Prototype clone(); }
class ConcretePrototype implements Prototype {
  public Prototype clone() { return new ConcretePrototype(/* copy fields */); }
}
```

**浅克隆**：复制基本字段，共享引用对象。  
**深克隆**：引用对象也复制一份，互不影响。
**答题例句**：当构造过程复杂或客户端不知道具体类时，可通过原型对象的克隆方法创建新对象。

## 3.6 单例 Singleton

**识别**：一个类只能有一个实例，如配置、日志、连接池。  
**理解例子**：全局配置 `ConfigManager` 只应有一个，否则不同模块读到的配置可能不一致。  
**意图**：保证全局唯一实例，并提供访问点。  
**UML**：Singleton 私有构造，静态 instance，getInstance。

```java
class Singleton {
  private static final Singleton INSTANCE = new Singleton();
  private Singleton() {}
  public static Singleton getInstance() { return INSTANCE; }
}
```

**优点**：节省资源，统一状态。  
**缺点**：全局状态可能降低可测试性，需注意线程安全。
**答题例句**：私有构造方法防止外部 new，静态成员保存唯一实例，静态方法提供全局访问点。

---

# 4. 结构型模式

## 4.1 适配器 Adapter

**识别**：已有类功能可用，但接口不符合客户端要求；第三方库/旧系统接入。  
**理解例子**：旧播放器只有 `playMp3()`，新系统要求调用 `play()`，用 Adapter 把 `play()` 转成 `playMp3()`。  
**意图**：将 Adaptee 接口转换成 Target 接口。  
**UML**：Client -> Target；Adapter 实现 Target，并持有 Adaptee。

```java
interface Target { void request(); }
class Adaptee { void specificRequest(){} }
class Adapter implements Target {
  private Adaptee adaptee;
  Adapter(Adaptee a){ this.adaptee = a; }
  public void request(){ adaptee.specificRequest(); }
}
```

**关键词**：接口不兼容、转换、复用旧类。
**答题例句**：客户端面向 Target，适配器内部调用 Adaptee，从而在不修改旧类的情况下复用旧功能。

## 4.2 桥接 Bridge

**识别**：两个独立变化维度，如 形状×颜色、消息类型×发送渠道、平台×窗口。  
**理解例子**：消息系统中“普通/加急/特急消息”和“短信/邮件/微信发送”独立变化，若继承会出现 3×3 个类，桥接可拆成两个维度。  
**意图**：抽象部分与实现部分分离，使二者可独立变化。  
**UML**：Abstraction 持有 Implementor；二者各自扩展。

```java
interface Implementor { void impl(); }
class ImplA implements Implementor { public void impl(){} }
abstract class Abstraction {
  protected Implementor impl;
  Abstraction(Implementor i){ impl = i; }
  abstract void operation();
}
class RefinedAbstraction extends Abstraction {
  RefinedAbstraction(Implementor i){ super(i); }
  void operation(){ impl.impl(); }
}
```

**优点**：避免 m×n 类爆炸；符合组合复用原则。
**答题例句**：抽象类中持有实现接口，把两个变化维度通过组合连接起来，而不是用多层继承绑定。

## 4.3 组合 Composite

**识别**：树形结构；文件夹/文件、菜单/菜单项、部门/员工；希望统一处理整体和部分。  
**理解例子**：文件夹里可以有文件，也可以有子文件夹；客户端调用 `getSize()` 时不必区分文件和文件夹。  
**意图**：让客户端一致地使用叶子对象和组合对象。  
**UML**：Component；Leaf；Composite 持有 List<Component>。

```java
abstract class Component { abstract void operation(); }
class Leaf extends Component { void operation(){} }
class Composite extends Component {
  private List<Component> children = new ArrayList<>();
  void add(Component c){ children.add(c); }
  void operation(){ for(Component c: children) c.operation(); }
}
```

**关键词**：树、递归、整体-部分、一致处理。
**答题例句**：抽象组件统一叶子和容器接口，容器内部保存子组件列表，并递归调用子组件方法。

## 4.4 装饰 Decorator

**识别**：不改原类，运行时动态增加功能；功能可叠加，如 Java IO、加密叠加、咖啡加料。  
**理解例子**：一杯基础咖啡可以动态加奶、加糖、加巧克力，每种配料都是一个装饰器，可任意叠加。  
**意图**：用组合代替继承，动态给对象添加职责。  
**UML**：Decorator 实现 Component，并持有 Component；ConcreteDecorator 扩展功能。

```java
interface Component { void operation(); }
class ConcreteComponent implements Component { public void operation(){} }
abstract class Decorator implements Component {
  protected Component c;
  Decorator(Component c){ this.c = c; }
  public void operation(){ c.operation(); }
}
class DecoratorA extends Decorator {
  DecoratorA(Component c){ super(c); }
  public void operation(){ super.operation(); added(); }
  void added(){}
}
```

**易混**：装饰 = 增强功能；适配器 = 转换接口；代理 = 控制访问。
**答题例句**：装饰器和被装饰对象实现同一接口，装饰器内部先调用原对象功能，再添加额外职责。

## 4.5 外观 Facade

**识别**：子系统很复杂，客户端调用多个类且顺序固定；希望提供统一入口。  
**理解例子**：文件加密需要读取文件、加密、保存文件，客户端只调用 `EncryptFacade.encrypt()` 即可。  
**意图**：为子系统提供高层统一接口，降低客户端与子系统耦合。  
**UML**：Client -> Facade；Facade -> SubSystemA/B/C。

```java
class SubA { void a(){} }
class SubB { void b(){} }
class Facade {
  private SubA a = new SubA();
  private SubB b = new SubB();
  void operation(){ a.a(); b.b(); }
}
```

**关键词**：统一入口、简化调用、迪米特原则。
**答题例句**：外观类封装对子系统的调用顺序，客户端不再直接依赖多个子系统类。

## 4.6 代理 Proxy

**识别**：不直接访问真实对象，需要权限控制、远程访问、缓存、日志、延迟加载。  
**理解例子**：大图片加载很慢，先显示代理对象，真正需要显示时再加载真实图片。也可用于权限校验后再访问真实服务。  
**意图**：为真实对象提供代理，并控制对真实对象的访问。  
**UML**：Subject；RealSubject；Proxy 持有 RealSubject。

```java
interface Subject { void request(); }
class RealSubject implements Subject { public void request(){} }
class Proxy implements Subject {
  private RealSubject real;
  public void request(){
    if(real == null) real = new RealSubject();
    // check/cache/log
    real.request();
  }
}
```

**易混**：代理和真实对象接口相同，重点是控制访问；装饰重点是增加职责。
**答题例句**：代理类与真实类实现同一接口，代理在调用真实对象前后加入权限、缓存、日志或延迟加载逻辑。

---

# 5. 行为型模式

## 5.1 策略 Strategy

**识别**：同一任务有多种算法/策略，可自由切换，如排序、支付、折扣、出行路线。  
**理解例子**：购物结算时可选择满减、打折、会员价；支付时可选择微信、支付宝、银行卡。  
**意图**：封装算法族，使算法可互换。  
**UML**：Context 持有 Strategy；ConcreteStrategy 实现算法。

```java
interface Strategy { void algorithm(); }
class StrategyA implements Strategy { public void algorithm(){} }
class Context {
  private Strategy s;
  Context(Strategy s){ this.s = s; }
  void execute(){ s.algorithm(); }
}
```

**优点**：消除大量 if-else，符合开闭原则。  
**易混**：策略通常由外部选择；状态由对象内部状态变化驱动。
**答题例句**：将不同算法封装成策略类，Context 只依赖策略接口，从而消除大量 if-else。

## 5.2 模板方法 Template Method

**识别**：流程固定，如“打开文件-读取-处理-关闭”，某些步骤由子类实现。  
**理解例子**：泡茶和泡咖啡流程都包含“烧水-冲泡-倒入杯中-加调料”，但冲泡内容和调料不同。  
**意图**：父类定义算法骨架，子类重定义某些步骤。  
**UML**：AbstractClass.templateMethod() 调用 primitiveOperation()；子类实现步骤。

```java
abstract class AbstractClass {
  final void templateMethod(){ step1(); step2(); hook(); }
  void step1(){}
  abstract void step2();
  void hook(){}
}
class ConcreteClass extends AbstractClass { void step2(){} }
```

**关键词**：流程骨架、固定步骤、钩子方法。
**答题例句**：父类定义不可变的算法骨架，子类只重写变化步骤，适合流程稳定但步骤可变的场景。

## 5.3 观察者 Observer

**识别**：一个对象变化，多个对象自动更新；消息订阅、事件监听、GUI。  
**理解例子**：公众号发布文章后，所有订阅用户收到通知；按钮被点击后多个监听器执行响应。  
**意图**：建立一对多依赖，让主题变化时通知所有观察者。  
**UML**：Subject 持有 List<Observer>；Observer.update()。

```java
interface Observer { void update(); }
class Subject {
  private List<Observer> list = new ArrayList<>();
  void attach(Observer o){ list.add(o); }
  void notifyAllObs(){ for(Observer o: list) o.update(); }
}
```

**优点**：主题和观察者解耦；支持广播通知。  
**缺点**：通知链复杂时调试困难。
**答题例句**：Subject 保存观察者集合，状态变化时统一调用 `update()`，实现一对多通知。

## 5.4 命令 Command

**识别**：请求需要排队、记录日志、撤销/恢复、宏命令；调用者不应知道接收者细节。  
**理解例子**：遥控器按钮不直接操作电灯，而是绑定 `LightOnCommand`、`LightOffCommand`；以后还能记录和撤销。  
**意图**：将请求封装成对象。  
**UML**：Invoker -> Command；ConcreteCommand 持有 Receiver。

```java
interface Command { void execute(); }
class Receiver { void action(){} }
class ConcreteCommand implements Command {
  private Receiver r;
  ConcreteCommand(Receiver r){ this.r = r; }
  public void execute(){ r.action(); }
}
class Invoker { private Command c; void call(){ c.execute(); } }
```

**关键词**：请求对象化、撤销、队列、日志、遥控器按钮。
**答题例句**：把请求封装为命令对象，调用者只执行命令，命令内部再调用真正接收者。

## 5.5 职责链 Chain of Responsibility

**识别**：请求有多个可能处理者，按顺序尝试，如请假审批、报销审批、过滤器链。  
**理解例子**：报销金额小由科长批，中等由处长批，更大由副校长或校长批；请求沿审批链向后传递。  
**意图**：让多个对象都有机会处理请求，避免发送者与接收者耦合。  
**UML**：Handler 持有 next；ConcreteHandler 处理或转发。

```java
abstract class Handler {
  protected Handler next;
  void setNext(Handler n){ next = n; }
  abstract void handle(int req);
}
class HandlerA extends Handler {
  void handle(int req){ if(req < 100) { } else if(next != null) next.handle(req); }
}
```

**优点**：动态调整链；符合开闭原则。  
**缺点**：请求可能无人处理，链过长影响性能。
**答题例句**：每个处理者持有下一个处理者，能处理就处理，不能处理就转发。

## 5.6 状态 State

**识别**：对象在不同状态下行为不同，状态可转换；电梯、订单、播放器、TCP 连接。  
**理解例子**：订单在“待支付”时可以付款，在“已发货”时可以确认收货，在“已完成”时不能再取消。  
**意图**：将状态相关行为封装到状态类中，使状态变化看起来像改变了对象的类。  
**UML**：Context 持有 State；State.handle(Context)。

```java
interface State { void handle(Context c); }
class Context {
  State state;
  void setState(State s){ state = s; }
  void request(){ state.handle(this); }
}
class StateA implements State {
  public void handle(Context c){ /* behavior */ c.setState(new StateB()); }
}
```

**易混**：状态强调“状态迁移”；策略强调“算法替换”。
**答题例句**：把不同状态下的行为放入不同状态类，Context 将请求委托给当前状态对象处理。

## 5.7 中介者 Mediator

**识别**：多个对象互相引用、关系网复杂；聊天室、GUI 控件联动。  
**理解例子**：聊天室中用户不直接互相持有引用，而是把消息发给聊天室，由聊天室转发给其他用户。  
**意图**：用中介对象封装对象间交互，降低多对多耦合。  
**UML**：Colleague 只和 Mediator 通信；Mediator 协调各 Colleague。

```java
interface Mediator { void notify(Colleague c, String event); }
abstract class Colleague { protected Mediator m; }
class ConcreteMediator implements Mediator {
  public void notify(Colleague c, String event){ /* coordinate */ }
}
```

**优点**：对象间解耦；集中控制交互。  
**缺点**：中介者可能过于复杂。
**答题例句**：同事类只与中介者通信，中介者集中协调对象之间的交互，降低网状耦合。

## 5.8 备忘录 Memento

**识别**：需要撤销/恢复历史状态，且不暴露对象内部细节。  
**理解例子**：文本编辑器保存编辑前的状态，点击撤销时恢复；游戏保存存档，失败后读档。  
**意图**：在不破坏封装的前提下保存对象状态。  
**UML**：Originator 创建/恢复 Memento；Caretaker 保存 Memento。

```java
class Memento { String state; Memento(String s){ state = s; } }
class Originator {
  private String state;
  Memento save(){ return new Memento(state); }
  void restore(Memento m){ state = m.state; }
}
class Caretaker { private Memento m; }
```

**关键词**：快照、撤销、历史记录、恢复。
**答题例句**：Originator 负责创建和恢复快照，Caretaker 只保存快照，不直接访问对象内部状态。

---

# 6. 高频混淆题速判

| 混淆组 | 区分方法 |
|---|---|
| 简单工厂 vs 工厂方法 | 简单工厂一个工厂 + if/switch；工厂方法抽象工厂 + 多个具体工厂。 |
| 工厂方法 vs 抽象工厂 | 工厂方法创建一种产品；抽象工厂创建一族产品。 |
| 抽象工厂 vs 建造者 | 抽象工厂强调产品族；建造者强调复杂对象分步骤构建。 |
| 适配器 vs 外观 | 适配器解决接口不兼容；外观简化复杂子系统入口。 |
| 适配器 vs 装饰 | 适配器改变接口；装饰不改变接口，只增强功能。 |
| 装饰 vs 代理 | 装饰增加职责；代理控制访问。二者结构相似但意图不同。 |
| 桥接 vs 适配器 | 桥接是设计前期拆分两个维度；适配器是事后兼容旧接口。 |
| 组合 vs 装饰 | 组合表示树形整体-部分；装饰表示功能叠加。 |
| 策略 vs 状态 | 策略由外部选择算法；状态由内部状态迁移改变行为。 |
| 策略 vs 模板方法 | 策略用组合替换算法；模板用继承固定流程、重写步骤。 |
| 命令 vs 策略 | 命令封装“请求/动作”；策略封装“算法”。 |
| 职责链 vs 命令 | 职责链多个处理者传递请求；命令把请求对象化交给接收者执行。 |

---

# 7. 典型场景答题小抄

| 场景描述 | 答题抓手 |
|---|---|
| “新增一种产品不能修改原有代码” | 用工厂方法：抽象工厂 + 具体工厂，新增产品新增工厂。 |
| “同一风格的一组控件/设备要一起创建” | 用抽象工厂：一个工厂对应一个产品族。 |
| “对象有很多组成部分，构建顺序复杂” | 用建造者：Director 控制流程，Builder 构造部件。 |
| “第三方类功能能用但方法名不一样” | 用适配器：Adapter 实现目标接口，内部调用旧接口。 |
| “两个维度组合导致类数量成倍增长” | 用桥接：两个维度分别抽象，用组合连接。 |
| “整体和部分形成树，客户端不想区分” | 用组合：Component 统一 Leaf 和 Composite。 |
| “在不改对象的情况下叠加功能” | 用装饰：装饰器包裹组件，可多层包装。 |
| “多个系统调用太复杂，想一键完成” | 用外观：Facade 封装调用顺序。 |
| “执行前要权限/缓存/延迟加载” | 用代理：Proxy 控制对 RealSubject 的访问。 |
| “算法很多，经常切换” | 用策略：Context 持有 Strategy。 |
| “流程固定，步骤不同” | 用模板方法：父类定骨架，子类改步骤。 |
| “状态变了行为也变” | 用状态：Context 委托给当前 State。 |
| “请求逐级上报或过滤” | 用职责链：Handler 持有 next。 |

# 7. 快速画 UML 的套路

1. 先画抽象：接口/抽象类放上方，如 Product、Component、Strategy、Subject。
2. 再画具体：ConcreteX 放下方，用实现/泛化箭头指向抽象。
3. 再画持有关系：谁内部有谁，就画关联/聚合线，如 Context 持有 Strategy，Decorator 持有 Component。
4. 再画 Client：客户端一般只依赖抽象，不直接依赖具体类。
5. 类名按题目替换：如 Logger/Product、Payment/Strategy、File/Composite。

## 万能代码骨架

```java
interface Abstraction { void operation(); }
class ConcreteA implements Abstraction { public void operation(){} }
class Context {
  private Abstraction obj;
  Context(Abstraction obj){ this.obj = obj; }
  void business(){ obj.operation(); }
}
```

只要题目强调“可扩展、可替换、减少 if-else”，基本都可以先抽象接口，再由 Context/Factory/Facade/Decorator 等角色使用该接口。
