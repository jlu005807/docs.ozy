# SQL进阶

中级 SQL 聚焦多表关联、数据安全（授权）、数据一致性（事务、完整性约束）、数据抽象（视图）等关键能力



## 连接操作（Joined Relations）

连接操作接收两个关系（数据库中即 “表”），并返回另一个关系（结果表）作为输出。

连接操作本质是一种 “带条件筛选的笛卡尔积”—— 要求两个表中的元组（行）满足某一匹配条件，同时还会明确指定连接结果中包含哪些属性（列）。

连接操作通常在`FROM`子句中作为子查询表达式使用。



### 外连接（Outer Join）

| 术语                           | 通俗解释                                                     |
| ------------------------------ | ------------------------------------------------------------ |
| **Natural Join（自然连接）**   | 自动匹配两个表中「列名 + 数据类型完全相同」的列（比如 course 和 prereq 都有 course_id，就自动按这个列匹配），结果中会去重重复的列（只留一个 course_id） |
| **Join Type（连接类型）**      | 内连接（inner）：**只保留匹配行**；左 / 右外连接（left/right outer）：保留左 / 右表所有行；全外连接（full outer）：保留两侧所有行 |
| **Join Condition（连接条件）** | ON <条件>：手动指定匹配规则（比如只按 course_id 匹配）；USING (列名)：手动指定匹配列（自动去重该列）；Natural：自动匹配同名列 |

普通的 “内连接（Inner Join）” 只会保留两个表中**完全匹配**的行，不匹配的行直接丢弃（比如 “课程表有 CS-315，但先修课表没它的记录”，内连接会直接丢掉 CS-315）；

外连接是内连接的 “升级版”，核心目标就是**不丢数据**—— 哪怕行不匹配，也要保留下来。

先计算（普通）连接的结果，然后把其中一个表中 “与另一个表无匹配行” 的那些元组（行），补充到连接结果中。

1. 先做一次内连接，得到所有匹配的行
2. 再把 “没匹配上的行” 加回来
3. 使用空值（null）填充缺失的列

外连接分三类：

- 左外连接：加左表的不匹配行；
  - 以左侧的连接表为 “基准”，保留左表的**所有行**：
- 右外连接：加右表的不匹配行；
  - 以右侧的连接表为 “基准”，保留右表的**所有行**：
- 全外连接：加左右两表的不匹配行。
  - 同时保留左表和右表的所有行，相当于 “左外 + 右外” 的并集：

> [!tip]
>
> 最常见的 JOIN 类型：**SQL INNER JOIN（简单的 JOIN）**。 SQL INNER JOIN 从多个表中返回满足 JOIN 条件的所有行。
>
> ```sql
> SELECT column1, column2, ...
> FROM table1
> JOIN table2 condition;
> ```
>
> 参数说明：
>
> - **column1, column2, ...**：要选择的字段名称，可以为多个字段。如果不指定字段名称，则会选择所有字段。
> - **table1**：要连接的第一个表。
> - **table2**：要连接的第二个表。
> - **condition**：连接条件，用于指定连接方式。
>   - `natural`：自动匹配两表**列名 + 数据类型完全相同**的列（比如都有 “course_id” 就自动按这个列匹配）；
>   - `ON <predicate>`：手动写匹配规则（比如`ON 学生表.学号 = 选课表.学号`）；
>   - `using (A₁,A₂,…)`：手动指定匹配列（比如`USING(学号)`，自动去重该列）。
>
> 写法 1：逗号分隔（笛卡尔积 + WHERE 过滤）
>
> - 先对所有表做笛卡尔积（全量行两两组合），再通过 WHERE 子句同时过滤 “表关联条件” 和 “数据筛选条件”
>
> ```sql
> SELECT Student.Sno, Course.Cno, Grade
> FROM Student, Course, SC
> WHERE Student.Sno = SC.Sno AND Course.Cno = SC.Cno AND Sname=“李博”
> ```
>
> 写法 2：显式内连接（INNER JOIN + ON）
>
> - 分步内连接：先两两关联表（Student 与 SC、结果再与 Course），ON 子句仅指定表关联条件，WHERE 仅筛选目标数据
>
> ```sql
> SELECT Student.Sno, Course.Cno, Grade
> FROM ((Student INNER JOIN SC on Student.Sno = SC.Sno)
>       INNER JOIN Course ON Course.Cno = SC.Cno)
> WHERE Sname=“李博”
> ```
>
> 写法 3：显式内连接（INNER JOIN + USING）
>
> - 与写法 2 逻辑一致，仅用 USING (列名) 简化关联条件（自动匹配指定同名列）
>
> ```sql
> SELECT Student.Sno, Course.Cno, Grade
> FROM ((Student INNER JOIN SC USING(Sno))
>       INNER JOIN Course USING(Cno))
> WHERE Sname=“李博”
> ```
>
> 连接操作 = **连接条件（哪些行算匹配）** + **连接类型（不匹配行怎么处理）**



---

## 视图（View）

数据库的 “逻辑模型” 包含所有实际存储的表，但并非所有用户都需要 / 有权看到全部数据。

用一条 SQL 查询筛选出需要的字段，再通过 “视图” 把这个查询结果变成一个 虚拟关系即“虚拟的表”，用户只能访问这个虚拟表，看不到底层原表的敏感字段。

- 视图不是数据库中实际存储的数据表（非 “概念模型” 的一部分），它本质是**一段保存好的 SQL 查询语句**。
- 当用户查询视图时，数据库会执行这段保存的查询，从底层原表中获取数据并返回，相当于 “实时生成” 的虚拟表。
- **隐藏敏感数据、简化查询逻辑、控制数据访问范围**。

---

### 语法结构与含义

**`create view`** 的本质

```sql
create view v as <query expression>
```

- `create view`  SQL 关键字，声明 “创建一个视图”
- `v`视图名（自定义），相当于给后续的查询表达式起一个 “别名”
- `as`关联符，意思是 “这个视图等价于后面的查询逻辑”
- `<query expression>`  任意合法的 SQL 查询语句（单表查询、多表关联、聚合查询等都可以）

```sql
-- 视图名：cs_instructor_view；查询表达式：筛选计算机系的教师姓名+工号
create view cs_instructor_view as
select ID, name 
from instructor 
where dept_name = 'Comp. Sci.';
```

- 视图创建完成后，视图名就可以像普通数据表名一样使用：

  ```sql
  -- 直接查询视图，和查普通表的语法完全一致
  select * from cs_instructor_view;
  -- 也可以加条件筛选
  select name from cs_instructor_view where ID = '10101';
  ```

- 这里的 “virtual relation（虚拟关系）” 就是 “虚拟表”—— 用户看到的是一张 “表”，但底层并没有实际存储数据，只是实时计算的结果。

| 操作     | 视图定义（`create view`）                            | 执行查询并创建新表（`create table ... as select`） |
| -------- | ---------------------------------------------------- | -------------------------------------------------- |
| 本质     | 保存**查询语句（表达式）**，不执行、不存储数据       | 立即执行查询，将结果**物理存储**为新表             |
| 数据存储 | 无物理存储，视图本身不占存储空间                     | 有物理存储，新表会占用数据库空间                   |
| 数据同步 | 查询视图时，实时执行保存的表达式，结果和原表完全同步 | 新表数据是 “快照”，原表更新后，新表数据不会自动变  |
| 举例     | `create view v as select * from instructor;`         | `create table t as select * from instructor;`      |

---

### 聚合视图：封装复杂统计逻辑

```sql
-- 定义视图：按部门统计薪资总额，给结果列起别名（dept_name, total_salary）
create view departments_total_salary(dept_name, total_salary) as 
select dept_name, sum(salary)  -- 聚合函数sum计算薪资总和
from instructor
group by dept_name;  -- 按部门分组
```

**聚合视图的限制**：无法直接更新

- 因为`total_salary`是聚合计算结果（不是底层表的原始字段），无法映射回`instructor`表的单条记录，所以这类视图不支持`insert/update/delete`操作

---

### SQL 视图依赖关系

因为一个视图可以被用在另一个视图的定义表达式中。所以视图之间存在依赖关系

1. 直接依赖（depends directly on）：如果视图 v2 被用在视图 v1 的定义表达式中，那么视图 v1 “直接依赖” 于视图 v2。**核心特征**：依赖关系是 “直接的、无中间环节” 的。

   - `v1`的定义里直接用了`v2` → `v1 直接依赖 v2`；

   ```sql
   -- 第一步：创建视图v2（基础视图：2009年秋季的物理系课程）
   create view v2 as
   select course_id, building 
   from course join section on course.course_id = section.course_id
   where dept_name = 'Physics' and semester = 'Fall' and year = 2009;
   
   -- 第二步：创建视图v1（嵌套视图：基于v2，筛选Watson楼的物理系课程）
   create view v1 as
   select course_id 
   from v2  -- 这里直接使用了视图v2
   where building = 'Watson';
   ```

2. 间接依赖（depends on）:如果 v1 直接依赖 v2，或者存在一条从 v1 到 v2 的依赖路径，那么 v1 “依赖”（间接依赖）于 v2。依赖关系是 “传递的、有中间环节” 的（直接依赖是间接依赖的特殊情况）。

   ```sql
   -- 第三步：创建视图v3（基于v1，筛选课程号以'PHY'开头的课程）
   create view v3 as
   select course_id 
   from v1  -- 用了视图v1
   where course_id like 'PHY%';
   ```

   - 此时依赖链是：`v3 → v1 → v2 → course/section`
     - `v3 直接依赖 v1`；
     - `v3 间接依赖 v2`（因为 v3→v1→v2 有依赖路径）；
     - `v3 间接依赖 course/section`（v3→v1→v2→course/section）。

3. 递归视图（recursive）:如果一个视图 v 依赖于它自己（直接 / 间接），那么这个视图就是 “递归视图”。依赖链形成 “自环”，是特殊的嵌套视图

   - SQL 定义有一个 **强制固定结构**，**永远由两部分组成(基础查询+递归查询），通过 `UNION ALL` 拼接**，缺一不可

     ```sql
     CREATE RECURSIVE VIEW 递归视图名 AS
     -- ===================== 第一部分：基础查询（非递归部分 / 锚点查询 Anchor Member）
     SELECT 字段 FROM 表名 
     WHERE 顶级节点的条件;  -- 找到所有「根节点」，是递归的起点
     UNION ALL
     -- ===================== 第二部分：递归查询（递归部分 / Recursive Member）
     SELECT 表名.字段 FROM 表名 [别名]
     JOIN 递归视图名 ON 表名.父级字段 = 递归视图名.主键字段;  -- 核心：JOIN 视图自己，形成递归关联
     ```

   - 假设`department`表有字段`dept_id`（部门 ID）、`name`（部门名）、`parent_dept_id`（父部门 ID，顶级部门为 NULL），要查询 “所有部门及其所有子部门”：

     ```sql
     -- 递归视图v（PostgreSQL语法，不同数据库语法略有差异）
     create view v as
     -- 基础部分：查询顶级部门（无父部门）
     select dept_id, name, parent_dept_id 
     from department 
     where parent_dept_id is null
     union all
     -- 递归部分：查询子部门，这里直接引用了视图v本身！
     select d.dept_id, d.name, d.parent_dept_id
     from department d 
     join v on d.parent_dept_id = v.dept_id;
     ```

     这个视图`v`的定义中，递归部分直接使用了`v`自己 → `v 依赖于v` → `v是递归视图`。

---

### 视图更新

语法：`insert into v values (...);`向视图`v`插入一条数据

但是视图本身不存储数据，插入视图的操作最终会**映射到底层物理表**，且未在视图中列出的字段会自动填充`NULL`（需满足字段允许为`NULL`）

> [!caution]
>
> “简单视图” 的更新条件：
>
> 1. **FROM 子句仅含一个底层表**：视图基于`instructor`单表创建（无多表关联）；
> 2. **SELECT 子句仅含属性名**：无聚合、无表达式、无 DISTINCT；
> 3. **未选中的字段允许为 NULL**：`salary`字段允许为 NULL（若`salary`设为`NOT NULL`，该插入会失败）；
> 4. **无 GROUP BY/HAVING 子句**：视图定义中无分组逻辑。

---

### 物化视图（Materialized Views）

物化视图的本质：**把视图定义的查询结果，物理存储为一张真实的表**（而非普通视图仅保存查询语句）。

普通视图是 “虚表”（只存逻辑），物化视图是 “实表”（存数据）。

- 注意：物化视图的数据是 “快照”—— 如果底层表（比如`instructor`）的数据更新了（新增 / 修改 / 删除），物化视图里存储的旧数据就会 “过期”，和底层表不一致。
- 所以必须维护物化视图 —— 底层表更新时，同步更新物化视图的数据，保证一致性。

物化视图的创建、修改与删除语法同视图类似，区别是多了关键字 `MATERIALIZED`。

```sql
-- 物化视图写法：仅多一个 MATERIALIZED 关键字！
CREATE MATERIALIZED VIEW mv_avg_sal AS
SELECT dept_name, AVG(salary) avg_sal, COUNT(*) teacher_num 
FROM instructor 
GROUP BY dept_name;
```



---



## 事务(Transaction)

事务是数据库操作的**最小不可分割的工作单元**，核心目标是保证数据操作的「安全性」和「一致性」

- `Transaction = Unit of work`（事务 = 工作单元）即一个事务对应 “一组要完成的数据库操作”（可以是 1 条 SQL，也可以是多条 SQL）

原子事务（Atomic transaction）：事务的核心特性（原子性）

- 事务要么完全执行，要么回滚（撤销），就像从未发生过一样；即操作具有原子性

 Isolation from concurrent transactions（与并发事务的隔离性）

- 多个事务同时执行（并发）时，彼此 “隔离”—— 每个事务都感觉不到其他事务的存在，不会互相干扰；

事务的启动与结束：隐式启动 + 显式 / 自动结束

- 事务隐形启动，即事务不会要求你手动写 “开始事务”，而是「自动启动」
- 通过 commit/rollback 结束
  - `commit work`（提交事务）：事务中所有操作执行成功，**确认将修改永久保存**到数据库；
  - `rollback work`（回滚事务）：撤销事务中所有已执行的操作，数据**回到事务开始前**的状态；

每条 SQL 自动提交：大多数数据库（MySQL、Oracle、PostgreSQL 等）的默认规则是「每条 SQL 执行完自动提交」—— 这意味着 “单条 SQL 就是一个事务”，但如果想让多条 SQL 组成一个事务，必须关闭自动提交；

---



## 完整性约束（Integrity Constraints）

- 完整性约束防止数据库受到意外损坏
- 确保对数据库的授权修改不会导致数据一致性丢失

`not null`/`primary key`/`unique`/`check (P)`是 SQL 最基础的完整性约束，覆盖 “非空、唯一、自定义规则” 三大核心需求

### `NOT  NULL `约束

- SQL 中`NULL`表示「字段值未知 / 不存在」，不是空字符串（`''`）、0 这类 “有值但空” 的情况；
- `NOT NULL`约束强制字段必须有 “明确的值”，杜绝 “关键信息缺失” 的问题。

```sql
-- 定义部门表：name（部门名）和budget（预算）必须非空
CREATE TABLE department (
    dept_id INT,  -- 无约束，可NULL
    name VARCHAR(20) NOT NULL,  -- 部门名必填
    budget NUMERIC(12,2) NOT NULL  -- 预算必填（如100000.00）
);

-- 错误1：name为NULL（部门名未填）
INSERT INTO department VALUES (1, NULL, 50000.00);
-- 数据库报错：Column 'name' cannot be null

-- 错误2：budget为NULL（预算未填）
INSERT INTO department VALUES (2, 'Finance', NULL);
-- 数据库报错：Column 'budget' cannot be null

-- 正确：两个字段都填值
INSERT INTO department VALUES (1, 'Finance', 50000.00);
```

---

### UNIQUE 约束

- UNIQUE 约束声明属性 A1、A2…Am 构成一个候选键；其中候选键的字段 / 字段组合的值必须唯一；可以作为 “备选” 唯一标识
- 候选键允许为 NULL（与主键相反）；同时UNIQUE 约束中，`NULL`不参与 “唯一性校验”（因为 SQL 规定`NULL ≠ NULL`）；

```sql
-- 课程表：课程号+学期+年份 组合成候选键（唯一标识一门课的开课信息）
CREATE TABLE section (
    course_id VARCHAR(5),
    semester VARCHAR(10),
    year INT,
    room_number VARCHAR(10),
    UNIQUE (course_id, semester, year)  -- 组合候选键：这三个字段一起唯一
);

-- 合法：组合值唯一
INSERT INTO section VALUES ('CS101', 'Fall', 2023, '101');

-- 非法：组合值重复（同一课程、学期、年份）
INSERT INTO section VALUES ('CS101', 'Fall', 2023, '102');
-- 报错：Duplicate entry 'CS101-Fall-2023' for key 'course_id'
```

### `CHECK (P)`约束

`CHECK (P)`：强制要求：向表中插入 / 修改数据时，必须满足谓词`P`的逻辑条件，否则操作被拒绝

-  只有符合`P`这个规则的数据才能存进去，违反规则的直接报错拦截。

```sql
create table section (
  course_id varchar(8),    -- 课程ID
  sec_id varchar(8),       -- 课段ID
  semester varchar(6),     -- 学期（核心约束字段）
  year numeric(4,0),       -- 年份（4位整数，无小数）
  building varchar(15),    -- 教学楼
  room_number varchar(7),  -- 教室号
  time_slot_id varchar(4), -- 时间段ID
  primary key (course_id, sec_id, semester, year), -- 复合主键
  check (semester in ('Fall', 'Winter', 'Spring', 'Summer')) -- CHECK约束
);
```

约束核心：`check (semester in ('Fall', 'Winter', 'Spring', 'Summer'))`即`semester`字段的值必须是括号内的四个字符串之一，否则判定为 “违反约束”。

`CHECK`约束在**INSERT（插入）** 和**UPDATE（修改）** 操作时触发：

- 插入新数据：先校验是否符合 P，符合才存入，不符合直接报错；
- 修改已有数据：修改后的值需符合 P，否则修改失败，数据保持原样。

> [!tip]
>
> `P`可以是任何返回布尔值的 SQL 表达式，比如：
>
> - 数值范围：`check (year >= 2000 and year <= 2100)`（年份只能在 2000-2100 之间）
> - **字符串匹配**：`check (building like 'Watson%')`（教学楼以 Watson 开头）
> - 多字段联动：`check (year > 2000 or semester = 'Fall')`（年份 > 2000 或 学期是 Fall）
> - 数值计算：`check (salary >= 3000 and salary <= 50000)`（工资在 3000-50000 之间）



### 参照完整性（Referential Integrity）

- 确保一个关系中某组属性的值，也出现在另一个关系的某组属性中

**外键（Foreign Key）**的正式定义

- 设`A`是一组属性，`R`和`S`是两个包含`A`的关系，且`A`是`S`的主键；
- 若`R`中任意`A`的值都能在`S`的`A`中找到，则`A`是`R`的**外键**（`R`= 从表，`S`= 主表 / 被参照表）；
- 外键是 “从表” 指向 “主表主键” 的引用，保证数据的关联性和一致性。

```sql
-- 写法1：字段后直接声明外键（简洁版）
create table course (
  course_id char(5) primary key,  -- 课程ID（主键）
  title varchar(20),              -- 课程名
  dept_name varchar(20) references department  -- 外键：引用department表的主键（默认是dept_name）
);

-- 写法2：表级显式声明外键（支持级联操作，推荐）
create table course (
  course_id char(5) primary key,
  title varchar(20),
  dept_name varchar(20),
  -- 显式声明外键，指定级联操作
  foreign key (dept_name) references department(dept_name)  -- 明确引用department的dept_name字段
  on delete cascade  -- 主表（department）删除记录时，从表（course）自动删除关联记录
  on update cascade, -- 主表（department）更新dept_name时，从表（course）自动更新关联值
);
```

级联操作的替代方案（除了 cascade）

| 操作类型                     | 含义                                   | 示例场景                                                     |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `on delete set null`         | 主表删除记录时，从表外键字段设为 NULL  | 删除 “生物系” 后，所有生物系课程的 dept_name 设为 NULL（需 dept_name 允许 NULL） |
| `on delete set default`      | 主表删除记录时，从表外键字段设为默认值 | 需先给 dept_name 设默认值（如`dept_name varchar(20) default 'Unknown'`） |
| `on delete restrict`（默认） | 拒绝删除主表记录（若从表有关联数据）   | 若有生物系课程，无法删除 department 表的 “Biology” 记录      |

---

#### 自引用外键

外键引用**本表的主键**（如 person 表的 father/mother 字段引用本表的 ID），用于表示 “递归关系”（如人员的父母关系、部门的上下级关系）。

```sql
create table person (
  ID char(10),
  name char(40),
  mother char(10),  -- 母亲的ID
  father char(10),  -- 父亲的ID
  primary key ID,
  foreign key father references person(ID),  -- 引用本表ID
  foreign key mother references person(ID)   -- 引用本表ID
);
```

对于自引用外键插入数据不违反约束的 3 种方法

方法 1：先插父母，再插子女（最直接）

```sql
-- 1. 先插入父母的记录
insert into person values ('001', '张三', NULL, NULL);  -- 张三无父母记录
insert into person values ('002', '李四', NULL, NULL);
-- 2. 再插入子女的记录（father/mother指向已存在的ID）
insert into person values ('003', '张小三', '002', '001');
```

方法 2：先设 NULL，后更新（需字段允许 NULL）

```sql
-- 1. 先插入所有人员，父母字段设为NULL
insert into person values ('001', '张三', NULL, NULL);
insert into person values ('002', '李四', NULL, NULL);
insert into person values ('003', '张小三', NULL, NULL);
-- 2. 再更新父母字段（此时父母ID已存在）
update person set mother='002', father='001' where ID='003';
```

- 限制：若 mother/father 声明为`NOT NULL`，此方法不可用。

方法 3：延迟约束检查（Defer Constraint Checking）

- 核心：默认每条 SQL 执行后立即检查外键约束，延迟检查则 “事务提交时才校验”；

- 场景：插入循环依赖数据（如 A 的父亲是 B，B 的儿子是 A）；

- 语法（以 PostgreSQL 为例）：

  ```sql
  SET CONSTRAINTS ALL DEFERRED;  -- 延迟所有约束检查
  -- 插入循环依赖数据
  insert into person values ('001', '张三', NULL, '002');
  insert into person values ('002', '李四', NULL, '001');
  COMMIT;  -- 提交时检查（若仍不满足则报错）
  ```

#### CHECK 约束与断言的局限性

```sql
-- 试图用CHECK约束：section的time_slot_id必须在time_slot表中存在
check (time_slot_id in (select time_slot_id from time_slot))
```

- 想保证 “课程段的时间段 ID 都是有效的、存在的”。

- 为什么不优先用外键（Foreign Key）？

  > **被引用的字段必须是主表的主键或候选键（UNIQUE 约束）**；如果`time_slot.time_slot_id`仅仅为主键的一部分不满足这个条件，外键无法创建，才会退而求其次想写 CHECK 约束

Every section has at least one instructor teaching the section（每个课程段至少有一位授课教师）

- `section` 表的每条课程段记录，必须在 `teaches` 表（授课表）中有至少一条对应的教师授课记录（即 `section(course_id, sec_id, semester, year)` 必须匹配 `teaches` 表的相同字段组合）。
- CHECK 子句不支持子查询：所有主流数据库都**禁止在 CHECK 约束中嵌套子查询**
- Assertion（断言）也不被支持
  - SQL 标准提供了 `create assertion <断言名> check <谓词>` 语法，用于定义**跨表复杂约束**

唯一可行的替代方案：**Triggers**（触发器，后续知识点）



## Built-in Data Types in SQL（日期 / 时间类数据）

| 类型        | 原文定义直译                               | 通俗解读                                                     | 关键特征                            |
| ----------- | ------------------------------------------ | ------------------------------------------------------------ | ----------------------------------- |
| `date`      | 日期，包含 4 位年份、月份、日期            | 只存 “年月日”，不包含具体时间（比如生日、订单日期、入学日期） | 格式：`年-月-日`，无时间维度        |
| `time`      | 一天中的时间，包含时、分、秒（支持小数秒） | 只存 “时分秒”，不包含日期（比如上课时间、门店开门时间）      | 格式：`时:分:秒`，小数秒精确到微秒  |
| `timestamp` | 日期 + 一天中的时间                        | 同时存 “年月日 + 时分秒”（比如订单支付时间、日志记录时间），是最常用的时间类型 | 格式：`年-月-日 时:分:秒`，含小数秒 |
| `interval`  | 时间段（时间间隔）                         | 表示 “一段时间长度”（比如 1 天、2 小时、30 分钟），不是具体时间点 | 格式：`interval '数值' 时间单位`    |

1. `date`（日期类型）

   必须用单引号包裹，前缀`date`

   ```sql
   -- 定义表时指定字段类型为date
   CREATE TABLE student (
       id INT PRIMARY KEY,
       name VARCHAR(20),
       birthday DATE  -- 生日：仅存年月日
   );
   -- 插入date类型数据
   INSERT INTO student VALUES (1, '张三', DATE '2000-01-15');
   ```

2.  `time`（时间类型）

   支持两种写法：整数秒 / 小数秒（精确到 0.01 秒、0.001 秒等）：

   ```sql
   -- 定义表时指定time类型
   CREATE TABLE class_schedule (
       course_id VARCHAR(10),
       class_time TIME  -- 上课时间：仅存时分秒
   );
   -- 插入整数秒的time
   INSERT INTO class_schedule VALUES ('CS101', TIME '09:00:30');
   -- 插入带小数秒的time（09:00:30.75 即 9点0分30.75秒）
   INSERT INTO class_schedule VALUES ('CS102', TIME '09:00:30.75');
   ```

3. `timestamp`（时间戳类型）

   组合了`date`和`time`，是最常用的 “完整时间” 类型：

   ```sql
   -- 定义表时指定timestamp类型
   CREATE TABLE order_info (
       order_id INT PRIMARY KEY,
       pay_time TIMESTAMP  -- 支付时间：存年月日+时分秒
   );
   -- 插入timestamp数据（带小数秒）
   INSERT INTO order_info VALUES (1001, TIMESTAMP '2005-7-27 09:00:30.75');
   ```

4. `interval`（时间间隔类型）

   **不是时间点，而是 “时间段”**，核心用法是 “时间运算”

   规则 1：两个时间点相减 → 得到 interval（计算时间差）

   ```sql
   -- 示例：计算两个date的差值（得到“间隔多少天”）
   SELECT DATE '2005-07-27' - DATE '2005-07-20';  -- 结果：interval '7' day
   
   -- 示例：计算两个timestamp的差值（得到“间隔多少天+多少时间”）
   SELECT TIMESTAMP '2005-07-27 09:00:30.75' - TIMESTAMP '2005-07-26 08:00:30.75';
   -- 结果：interval '1' day '1' hour（1天1小时）
   ```

   规则 2：interval 可以加到时间点上 → 得到新的时间点（时间偏移）

   ```sql
   -- 示例1：date + interval → 新date（2005-07-27加1天 → 2005-07-28）
   SELECT DATE '2005-07-27' + INTERVAL '1' DAY;
   
   -- 示例2：time + interval → 新time（09:00:30加30分钟 → 09:30:30）
   SELECT TIME '09:00:30' + INTERVAL '30' MINUTE;
   
   -- 示例3：timestamp + interval → 新timestamp（加2小时）
   SELECT TIMESTAMP '2005-07-27 09:00:30.75' + INTERVAL '2' HOUR;
   -- 结果：timestamp '2005-07-27 11:00:30.75'
   ```



## 索引(Index)

索引是一种数据结构，用于加速访问 “索引字段具有指定值” 的记录；

**索引本质**：用 “空间换时间”—— 索引会占用额外存储空间，但大幅提升查询速度；

索引创建语句

```sql
create index studentID_index on student(ID);
```

这里手动创建`ID`字段的索引，**属于 “重复操作”** —— 因为`ID`是主键，数据库已经自动为其创建了主键索引；

若**字段不是主键**，想加速按该字段查询，才需要手动创建索引

索引的底层逻辑：索引的常用数据结构是**B + 树**（数据库默认）：

- 索引会将`ID`字段的值按顺序存储，并关联到对应记录的物理位置；
- 查询时，数据库通过 B + 树的 “二分查找” 快速定位目标值，无需全表扫描。



## 用户定义类型（User-Defined Types，UDT）

用户定义类型（UDT）是 SQL 提供的**自定义基础数据类型机制**，核心作用是**封装原生数据类型并赋予业务语义**

定义自定义类型：`create type Dollars as numeric (12,2) final`

**自定义类型≠约束**：`Dollars`仅封装了`numeric(12,2)`的类型规则，不包含业务约束（如 “预算不能为负”）—— 若要加约束，需结合`CHECK`：

**`final`关键字**：仅 SQL 标准支持 “类型继承”，主流数据库中`final`可省略，不影响使用。



## `CREATE DOMAIN`（自定义域类型）

`CREATE DOMAIN`是 SQL-92 标准中定义**自定义域类型**的语法，核心是：**在原生数据类型基础上，封装业务约束（如`NOT NULL`、`CHECK`），形成贴合业务规则的专属数据类型**。

- `CREATE DOMAIN`：不仅封装原生类型，还能加约束（如非空、值范围），是 “带规则的自定义类型”。
- 示例：`create domain person_name char(20) not null`

---

### `create type` vs `create domain`（易混点）

 “自定义类型（type）” 和 “自定义域（domain）”，核心区别如下：

| 特性 | `create type`（用户定义类型）           | `create domain`（自定义域）                                  |
| ---- | --------------------------------------- | ------------------------------------------------------------ |
| 核心 | 封装原生类型，仅赋予语义                | 封装原生类型 + 添加约束（如`NOT NULL`/`CHECK`）              |
| 示例 | `create type Dollars as numeric(12,2);` | `create domain Dollars as numeric(12,2) check (value >= 0);` |
| 场景 | 仅需统一类型语义 / 格式                 | 需在类型基础上加业务约束（如金额非负、分数范围 0-100）       |

---

## 大对象类型（Large-Object Types）

实际业务中会遇到**超大、非结构化 / 半结构化**的数据（如照片、视频、设计图纸、长篇文档）—— 这些数据体积可能从几 MB 到几十 GB，无法用普通字段存储，因此 SQL 设计了**`blob`/`clob`**两种 “大对象类型” 专门处理这类数据。

Blob/Clob 的核心区别：Blob 存二进制（无格式）、Clob 存字符（带编码）；

### 1. Blob（Binary Large Object，二进制大对象）

| 核心属性 | 解读                                                         | 典型应用场景                                                 |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 存储内容 | 无格式的二进制数据（0 和 1 组成的字节流），数据库**不解析、不理解**其内容 | 照片（JPG/PNG）、视频（MP4/AVI）、CAD 设计文件、音频（MP3）、安装包（EXE）、压缩包（ZIP） |
| 核心特征 | 数据库仅负责 “存” 和 “取”，数据的含义、格式解析完全交给外部应用（比如用图片查看器解析 JPG、用 CAD 软件解析图纸） | 比如把一张 10MB 的 JPG 照片存为 Blob，数据库只知道这是一串二进制字节，至于这是风景照还是人物照，需要应用程序（前端 / 后端）解析 |

### 2. Clob（Character Large Object，字符大对象）

| 核心属性 | 解读                                                         | 典型应用场景                                                 |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 存储内容 | 大量字符数据（带编码，如 UTF-8、GBK），数据库能识别 “字符” 但不解析语义 | 长篇小说、合同文本、日志文件、XML/JSON 大文档、网页源码      |
| 核心特征 | 相比普通`varchar`，Clob 无长度上限（或上限极高，如 GB 级），且保留字符编码，适合存储超长篇文本 | 比如把 10 万字的小说存为 Clob，数据库能识别其中的中文字符、标点，但不会理解小说的情节语义 |

查询大对象时返回 “指针” 而非实际数据；



## 权限管理（Authorization）

权限本质是 “数据库对用户操作的边界管控”，分为「数据操作权限」和「架构修改权限」

1. 数据操作权限（针对**表 / 视图的增删改查**）

| 权限类型                    | 英文定义                         | 典型操作示例                                                 |
| --------------------------- | -------------------------------- | ------------------------------------------------------------ |
| Read（对应 SQL 的`select`） | 仅允许读取数据，不能修改         | `select * from instructor where dept_name='CS'`              |
| Insert                      | 仅允许插入新数据，不能改已有数据 | `insert into instructor values ('1001', '张三', 'CS', 80000)` |
| Update                      | 仅允许修改已有数据，不能删除     | `update instructor set salary=85000 where ID='1001'`         |
| Delete                      | 仅允许删除数据                   | `delete from instructor where ID='1001'`                     |

2. 数据库架构（Schema）权限（针对**表结构 / 索引**的修改）

架构权限是 “更高阶的管理权限”，仅开放给数据库管理员 / 架构设计师，普通用户无此权限：

| 权限类型   | 英文定义             | 典型操作示例                                             |
| ---------- | -------------------- | -------------------------------------------------------- |
| Index      | 允许创建 / 删除索引  | `create index idx_instructor_id on instructor(ID)`       |
| Resources  | 允许创建新表（关系） | `create table student (ID varchar(5), name varchar(20))` |
| Alteration | 允许增删表的字段     | `alter table instructor add column age numeric(2,0)`     |
| Drop       | 允许删除表           | `drop table instructor`                                  |



### 授权（Grant）：给用户分配权限

```sql
grant <权限列表> on <表名/视图名> to <用户列表>;
```

- `<权限列表>`：单权限（如`select`/`insert`）、多权限（如`select, insert`）、`all privileges`（所有权限）
- `<表名/视图名>`： 具体表（如`instructor`）、具体视图（如`geo_instructor`）
- `<用户列表>` ：单个用户（如`U1`）、多个用户（如`U1, U2, U3`）、`public`（所有有效用户）、角色（如`instructor`）

授权者（执行`grant`的人）必须本身拥有该权限（或是数据库管理员 DBA）

同时注意：给视图授权 ≠ 给底层表授权

> [!tip]
>
> 带 “**转授权**选项”（With Grant Option）
>
> ```sql
> -- 给Amit授予department表的查询权限，且允许Amit把这个权限转授给其他人
> grant select on department to Amit with grant option;
> ```
>
> - `with grant option`是 “权限传递开关”，没有这个选项，用户只能自己用权限，不能给别人。



### 撤权（Revoke）：收回已分配的权限

```sql
revoke <权限列表> on <表名/视图名> from <用户列表>;
```

1. 撤权的级联 / 限制

   - `cascade`：级联撤权 —— 收回用户权限的同时，收回该用户通过`with grant option`转授给其他人的权限

     ```sql
     -- 级联收回Amit、Satoshi对department表的查询权限
     revoke select on department from Amit, Satoshi cascade;
     ```

   - `restrict`：限制撤权 —— 若该用户已转授权限给他人，撤权会失败（避免误删）

2. 撤权`public`的影响

   - 若`用户列表`包含`public`，所有用户都会失去该权限，除非是 “单独显式授权” 的用户（比如先给`public`授`select`权限，再单独给 U1 授`select`，撤`public`的权限后，U1 仍保留）。



### 角色（Role）：权限的 “分组管理”

角色是**权限的集合**，核心解决 “批量管理用户权限” 的问题

步骤 1：创建角色

```sql
create role instructor;        -- 创建“讲师”角色
create role teaching_assistant;-- 创建“助教”角色
create role dean;              -- 创建“院长”角色
```

步骤 2：给角色授权

```sql
-- 给“讲师”角色授予takes表的查询权限
grant select on takes to instructor;
```

步骤 3：角色分配（用户 / 其他角色）

```sql
-- 给用户Amit分配“讲师”角色（Amit拥有讲师的所有权限）
grant instructor to Amit;

-- 角色继承：给“讲师”角色分配“助教”角色（讲师继承助教的所有权限）
grant teaching_assistant to instructor;

-- 角色链：给“院长”角色分配“讲师”角色，再给Satoshi分配“院长”角色
grant instructor to dean;
grant dean to Satoshi;
```

- 最终效果：Satoshi（院长）→ 继承讲师权限 → 继承助教权限，拥有三级角色的所有权限。



### 视图权限的特殊场景（高频考点）

```sql
-- 1. 创建视图：仅显示地质系的讲师
create view geo_instructor as
(select * from instructor where dept_name = 'Geology');

-- 2. 给geo_staff角色授予视图的查询权限
grant select on geo_instructor to geo_staff;
```

1. **geo_staff 没有 instructor 表的权限，能查视图吗？**→ 能！**视图的权限独立于底层表** —— 只要创建视图的人有`instructor`表的权限，geo_staff 即使没有`instructor`表的权限，也能查`geo_instructor`视图（只能看到地质系数据，无法访问其他系）。
2. **创建视图的人没有 instructor 表的某些权限，会怎样？**→ 视图创建失败，或 geo_staff 查询视图时会报错 —— 比如创建视图的人只有`select`权限，没有`update`权限，那么 geo_staff 也只能查视图，不能改。



### References 权限（外键创建权限）

`REFERENCES` 是 SQL 中专门用于**控制 “创建外键”** 的权限 —— 当用户想在表 A 中创建外键、引用表 B 的某个字段时，必须先拥有表 B **对应字段的 `REFERENCES` 权限**，否则外键创建会直接失败。

```sql
grant reference (dept_name) on department to Mariano;
```

外键是数据库**参照完整性**的核心，若允许任意用户创建外键引用其他表，会导致数据一致性问题和恶意 / 误操作问题





# 关系代数与SQL的转换

1. 基础单表运算（最常用）

| 关系代数     | 符号 | 核心逻辑                      | SQL 关键字         | 示例（学生表 student：ID/name/dept_name/tot_cred）           |
| ------------ | ---- | ----------------------------- | ------------------ | ------------------------------------------------------------ |
| 选择运算     | σ    | 按条件筛选行（选 “哪些记录”） | WHERE              | 🔹 关系代数：σ(dept_name='CS')(student)🔹 SQL：`SELECT * FROM student WHERE dept_name='CS'` |
| 投影运算     | Π    | 按需求筛选列（选 “哪些字段”） | SELECT             | 🔹 关系代数：Π(ID, name)(student)🔹 SQL：`SELECT ID, name FROM student` |
| 去重运算     | δ    | 去除重复行                    | DISTINCT           | 🔹 关系代数：δ(dept_name)(student)🔹 SQL：`SELECT DISTINCT dept_name FROM student` |
| 重命名运算   | ρ    | 给表 / 字段起别名             | AS                 | 🔹 关系代数：ρ(s (学号，姓名))(student)🔹 SQL：`SELECT ID AS 学号, name AS 姓名 FROM student AS s` |
| 广义投影运算 | Π    | 投影 + 字段计算（如加减乘除） | SELECT（含表达式） | 🔹 关系代数：Π(ID, tot_cred+10)(student)🔹 SQL：`SELECT ID, tot_cred + 10 AS new_cred FROM student` |

2. 多表集合运算（合并 / 对比多个结果集）

| 关系代数     | 符号 | 核心逻辑                          | SQL 关键字           | 示例（学生表 student / 教师表 instructor：均有 ID 字段）     |
| ------------ | ---- | --------------------------------- | -------------------- | ------------------------------------------------------------ |
| 并运算       | ∪    | 合并两个结果集（去重）            | UNION                | 🔹 关系代数：Π(ID)(student) ∪ Π(ID)(instructor)🔹 SQL：`SELECT ID FROM student UNION SELECT ID FROM instructor` |
| 差运算       | −    | 取 “在 A 中但不在 B 中” 的行      | EXCEPT               | 🔹 关系代数：Π(ID)(student) − Π(ID)(instructor)🔹 SQL：`SELECT ID FROM student EXCEPT SELECT ID FROM instructor` |
| 交运算       | ∩    | 取 “A 和 B 中都有” 的行           | INTERSECT            | 🔹 关系代数：Π(ID)(student) ∩ Π(ID)(instructor)🔹 SQL：`SELECT ID FROM student INTERSECT SELECT ID FROM instructor` |
| 笛卡尔积运算 | ×    | 多表无条件拼接（A 每行配 B 每行） | FROM（多表逗号分隔） | 🔹 关系代数：student × instructor🔹 SQL：`SELECT * FROM student, instructor` |

3. 多表关联运算（核心）

| 关系代数 | 符号 | 核心逻辑                       | SQL 关键字         | 示例（student.dept_name 关联 department.dept_name）          |
| -------- | ---- | ------------------------------ | ------------------ | ------------------------------------------------------------ |
| 连接运算 | ⋈    | 多表按条件拼接（替代笛卡尔积） | JOIN（INNER JOIN） | 🔹 关系代数：student ⋈(student.dept_name=department.dept_name) department<br />🔹 SQL：`SELECT * FROM student JOIN department ON student.dept_name = department.dept_name` |

4. 复杂运算（分组 / 聚合 / 特殊逻辑）

| 关系代数 | 符号 | 核心逻辑                             | SQL 关键字 / 函数                 | 示例（instructor 表：dept_name/salary）                      |
| -------- | ---- | ------------------------------------ | --------------------------------- | ------------------------------------------------------------ |
| 赋值运算 | ←    | 给查询结果赋别名（临时存储）         | AS（表别名）                      | 🔹 关系代数：temp ← Π(dept_name, salary)(instructor)🔹 SQL：`SELECT dept_name, salary INTO temp FROM instructor`（或`SELECT ... AS temp`） |
| 聚集运算 | 𝐺    | 统计计算（求和 / 平均 / 计数等）     | 聚集函数（SUM/AVG/COUNT/MAX/MIN） | 🔹 关系代数：𝐺(AVG (salary))(instructor)🔹 SQL：`SELECT AVG(salary) FROM instructor` |
| 分组运算 | 𝐺    | 按字段分组后聚合                     | GROUP BY + 聚集函数               | 🔹 关系代数：𝐺(dept_name, AVG (salary))(instructor)🔹 SQL：`SELECT dept_name, AVG(salary) FROM instructor GROUP BY dept_name` |
| 除运算   | ÷    | 找 “包含所有指定值” 的记录（最复杂） | NOT EXISTS（双层子查询）          | 🔹 需求：找选了所有 “CS 系课程” 的学生 ID🔹 SQL：`SELECT s.ID FROM student s WHERE NOT EXISTS (``SELECT c.course_id FROM course c WHERE c.dept_name='CS' AND NOT EXISTS (``SELECT * FROM takes t WHERE t.ID=s.ID AND t.course_id=c.course_id``)``)` |

三、关键易错点（避坑指南）

1. UNION/EXCEPT/INTERSECT 的去重规则：
   - SQL 中这三个关键字默认去重（对应关系代数的 “集合运算”）；
   - 若要保留重复行，用`UNION ALL`（关系代数中无对应符号，属于 SQL 扩展）。

2. 笛卡尔积 vs JOIN：
   - 笛卡尔积（`FROM A,B`）是 “无条件连接”，几乎不用；
   - JOIN（`ON`条件）是 “有条件连接”，是关系代数`⋈`的实际落地，必用！

3. 除运算的替代逻辑：
   - 关系代数的`÷`在 SQL 中无直接关键字，必须用`NOT EXISTS`双层子查询实现（核心：“没有一个课程没被该学生选”=“选了所有课程”）。

4. 聚集运算的 NULL 处理：
   - SQL 聚集函数（如`COUNT`）会自动忽略 NULL 值，比如`COUNT(salary)`不计入 salary 为 NULL 的记录，需注意和关系代数理论的一致性。

5. 除法在SQL中的模板：设两个关系：R(X,Y)和S(Y)，R÷S的结果是一个新关系P(X)。

   ```sql
   SELECT DISTINCT 被除关系的X属性列 
   FROM 被除关系 R AS R1
   WHERE NOT EXISTS (
       SELECT * FROM 除关系 S
       WHERE NOT EXISTS (
           SELECT * FROM 被除关系 R AS R2
           WHERE R2.X属性列 = R1.X属性列 AND R2.Y属性列 = S.Y属性列
       )
   );
   ```

   