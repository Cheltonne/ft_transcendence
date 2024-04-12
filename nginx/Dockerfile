FROM 	nginx
COPY 	custom.conf /etc/nginx/nginx.conf
RUN     mkdir /etc/nginx/ssl
RUN		openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \                                                                                                           
		-out /etc/nginx/ssl/beaugosse.crt \                                     
        -keyout /etc/nginx/ssl/beaugosse.key \                                  
        -subj "/C=FR/ST=Paris/L=Paris/O=42 Paris/OU=chajax/CN=chajax/"
