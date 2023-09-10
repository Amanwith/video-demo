# 基础镜像使用java
#FROM java:8
FROM primetoninc/jdk:1.8
# 作者
MAINTAINER wh
# VOLUME 指定了临时文件目录为/tmp。
VOLUME /tmp
# 修改jar名
#ADD vedio-demo1-0.0.1-SNAPSHOT.jar app.jar
ADD jielong.jar app.jar
# 运行jar包
RUN bash -c 'touch /.jar'
ENTRYPOINT ["java","-jar","app.jar"]