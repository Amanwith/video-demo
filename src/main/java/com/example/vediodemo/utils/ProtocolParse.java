package com.example.vediodemo.utils;



public class ProtocolParse {

    public static void main(String[] args) {
        ProtocolParse protocolParse = new ProtocolParse("00/06/123456{'user':123, info:{....}}");
        System.out.println(protocolParse);
    }

    private static final int TYPE_OFFSET = 0;
    private static final int TYPE_LENGTH = 2;

    private static final int ACCEPT_LENGTH_OFFSET = 2;
    private static final int ACCEPT_LENGTH_LENGTH = 2;

    private static final int ACCEPT_OFFSET = 4;

    private int acceptLength;

    private final String message;
    private final String type;
    private final String acceptId;
    private final String info;

    public ProtocolParse(String message) {
        this.message = message;
        this.type = parseType();
        this.acceptId = parseAccept();
        this.info = parseInfo();
    }

    private String parseType() {
        return this.message.substring(TYPE_OFFSET, TYPE_OFFSET + TYPE_LENGTH);
    }

    private String parseAccept() {
        this.acceptLength = Integer.parseInt(
                this.message.substring(ACCEPT_LENGTH_OFFSET, ACCEPT_LENGTH_OFFSET + ACCEPT_LENGTH_LENGTH)
        );
        return this.message.substring(ACCEPT_OFFSET, ACCEPT_OFFSET + this.acceptLength);
    }

    private String parseInfo() {
        return this.message.substring(ACCEPT_OFFSET + this.acceptLength);
    }

    public String getType() {
        return type;
    }

    public String getAcceptId() {
        return acceptId;
    }

    public String getInfo() {
        return info;
    }

    @Override
    public String toString() {
        String temp  = info.length() > 100 ? info.substring(0, 50) : info;
        return "ProtocolParse{" +
                "acceptLength=" + acceptLength +
                ", message='" + temp+ '\'' +
                ", type='" + type + '\'' +
                ", acceptId='" + acceptId + '\'' +
                ", info='" + info + '\'' +
                '}';
    }
}
