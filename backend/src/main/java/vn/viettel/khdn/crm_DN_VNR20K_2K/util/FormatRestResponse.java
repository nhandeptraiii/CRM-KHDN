package vn.viettel.khdn.crm_DN_VNR20K_2K.util;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import jakarta.servlet.http.HttpServletResponse;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.RestResponse;

@ControllerAdvice
public class FormatRestResponse implements ResponseBodyAdvice {

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        Class<?> paramType = returnType.getParameterType();
        return !(byte[].class.equals(paramType)
                || org.springframework.core.io.Resource.class.isAssignableFrom(paramType));
    }

    @Override
    @Nullable
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {
        HttpServletResponse servletResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = servletResponse.getStatus();

        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(status);

        if (body instanceof String) {
            return body;
        }

        if (body instanceof RestResponse) {
            return body;
        }

        if (body instanceof byte[]) {
            return body;
        }

        if (body instanceof org.springframework.core.io.Resource) {
            return body;
        }

        if (selectedContentType != null && selectedContentType.includes(MediaType.APPLICATION_OCTET_STREAM)
                || selectedContentType != null && selectedContentType.includes(MediaType.APPLICATION_PDF)) {
            return body;
        }

        if (status >= 400) {
            return body;
        } else {
            if (body instanceof RestResponse) {
                RestResponse<?> restBody = (RestResponse<?>) body;
                if (restBody.getMessage() == null) {
                    restBody.setMessage("Call API successful");
                }
                return body;
            }
            res.setMessage("Call API successful");
            res.setData(body);
        }

        return res;
    }
}
