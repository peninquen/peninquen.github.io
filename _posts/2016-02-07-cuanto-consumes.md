---
published: false
---


# ¿Cuánto consumes?
##Motivos
> Espera... sí, aquí están las últimas facturas de luz, agua, son de hace dos meses, vaya esta es un poco alta, ya recuerdo, hubo un día que se quedó la mangera abierta y inundamos el jardín... la de la electricidad, esa no hablamos, los niños se dejan las luces de sus habitaciones, la tele encendida...
¿Potencia contratada? la que me puso el electricista, pues no sé si es mucho, solo sé que no salta el ICP, pero pago una factura por potencia que es la igual a la de energía...

Uno de los motivos para introducirme en la domótica es conocer lo que consumo, cuándo, cómo y porqué, y con los datos del contador es imposible.

Hace unos años me planteé cual sería el sistema para conocer el consumo, poder ajustar la potencia contratada, ajustar el encendido de algunos electrodomésticos al la mejor tarifa.

Mi primer intento lo hice con un [Efergy](http://efergy.com/es/products/electricity-monitors) pero no salí muy convencido, la información de potencia era aparente y no real o activa, por la ausencia de seguimiento del voltaje (solo dispone de pinza amperimétrica).

Así que busqué otras alternativas y encontré los equipos de Eastron, en particular el SDM120M. Este modelo permite la lectura de datos de voltaje, intensidad, potencia activa, factor de potencia, frecuencia, etc lcon lo que podemos realizar el seguimiento de los parametros necesarios. La comunicación de los datos la realizar utilizando el protocolo Modbus RTU sobre RS485.
##Montaje
Sobre arduino se puede implementar el protocolo Modbus RTU sobre un canal RS485.
El montaje físico tienes dos partes que no se tienes que mezclar: la eléctrica de 230V y la de comunicaciones y alimentación a 5V.

> ¡ATENCIÓN!¡PELIGRO DE DESCARGA ELÉCTRICA! SI NO TIENES CONOCIMIENTOS SUFICIENTES RECURRE A UN ELECTRICISTA PARA LA CONEXIÓN DEL EQUIPO
Para la conexión de 230V desconecta el suministro al cuadro donde vallas a instalar el SDM120. El SDM120 debe colocarse DESPUÉS de una protección magnetotérmica que asegure la desconexión en caso de corto interior al equipo.

Incluyo una serie de fotos de un montaje simplificado.

Para la conexión de comunicaciones necesitamos:
- Arduino MEGA, para la instalación final se puede realizar en un Arduino UNO, micro, con un solo puerto serie, pero para pruebas utilizamos el MEGA, utilizamos ``Serial`` para la carga de sketchs y debug, y ``Serial1`` para la conexión del canal RS485
- Conversor RS485-TTL, adapta los niveles de señal y realiza la conexión half-duplex.
- Cable de comunicaciones, la norma recomienda par trenzado de calibre AWG24. Teniendo en cuenta que vamos a utilizar pequeñas distancias y el entorno no es industrial con mucho ruido electromagnético, podremos relajar estas condiciones.
- Conversor RS485-USB, opcional, si queremos inspeccionar los paquetes que circulan por el canal.
- Resistencia 170R, a emplear como terminación de línea. En mi caso he podido mantener la comunicación si emplear la resistencia, seguramente en tiradas largas sea necesario.

El conversor RS485-TTL incluye las resistencias pull-up y pull-down del canal y de la conexión TTL, además de un condensador para el MAX485. Los pines indican DI('Driver IN')  para transmitir; RO ('Recevier OUT') para recibir; los pines DE ('Driver Enable') y RE ('Recevier Enable' NOT) para alternar entre transmitir y recibir.
![]({{site.baseurl}}/assets/images/max485-pins.png)
La alimentación debe asegurar al menos 2 voltios en el extremo contrario a la alimentación, por lo que dependiendo de la sección y longitud de la linea hay que fijar el voltaje. Para nuestra instalación podemos funcionar con los 5V de la alimentación. Por estabilidad no tomes la tensión del regulador del Arduino. 

así que a buscar una librería adecuada para que actúe como Master en la comunicación.

La primera opción fue utilizar SimpleModbusMaster (en [este hilo](http://forum.arduino.cc/index.php?topic=176142.0) se discute extensamente su utilización) y se pudo poner en marcha, pero con algún problema que no terminaba de convencerme.
- Programación en C. Me atrae mucho la programación orientada a objetos y el C++, y tal como esta planteada no veía la manera de encapsular los objetos.
- Muestreo continuo, en un principio parece una opción interesante, muestrear continuamente todos los parametros y guardar el último valor leído. Pero esto limita el uso de la librería para otros usos como actualización de parámetros o lecturas puntuales.
- No realiza tratamiento de excepciones o errores, el principal cuando el dispositivo se encuentra apagado ¿qué valor se utiliza? cero, el último leido, no hay dato. Teniendo encuenta que es una medida eléctrica, voltaje, intensidad y potencia son cero, el contador de energía el último valor leído válido.
- Posibles interferencias con otros procesos. Si el arduino se encuentra realizando otros procesos, el proceso Modbus tiene que ser 'no-bloqueo', entra, comprueba si tiene que hacer algo, lo hace rápido y sale al hilo principal.

Así que me puse manos a la obra a elaborar una librería nueva con dos objetos:
``ModbusMaster``, encargado de gestionar el protocolo Modbus RTU sobre un puerto serial.
``ModbusSensor``, objeto que representa el dato del equipo SDM, contiene la información de trama para realizar la petición y almacenar la respuesta.

El SMD120 trabaja en todos los sensores con valores ``float``,pero los parametros del equipo son también hexadecimales y BCD ¿cómo tratarlos? la primera opción fue centrarme en los datos float, pero no terminaba de estar convencido. Decidí hacer una gestión modbus solo con valores ``uint8_t`` de forma que si había que realizar alguna transfomación fuese en la siguiente capa.
