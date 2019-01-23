FROM jboss/keycloak:latest

RUN rm -rf /opt/jboss/keycloak/themes

COPY themes /opt/jboss/keycloak/themes

COPY recaptcha-login.jar /opt/jboss/keycloak/standalone/deployments/recaptcha-login.jar

CMD ["-b", "0.0.0.0", "-c", "standalone-ha.xml"]
