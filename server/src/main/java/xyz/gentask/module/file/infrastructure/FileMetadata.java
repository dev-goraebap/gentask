package xyz.gentask.module.file.infrastructure;

import java.util.HashMap;
import java.util.Map;
import org.jooq.JSONB;
import tools.jackson.databind.json.JsonMapper;

final class FileMetadata {
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private FileMetadata() {}

    static JSONB encode(String color, Integer width, Integer height) {
        Map<String, Object> metadata = new HashMap<>();
        if (color != null) metadata.put("dominantColor", color);
        if (width != null) metadata.put("width", width);
        if (height != null) metadata.put("height", height);
        return JSONB.valueOf(MAPPER.writeValueAsString(metadata));
    }

    static String color(JSONB metadata) {
        if (metadata == null) return null;
        var color = MAPPER.readTree(metadata.data()).get("dominantColor");
        return color != null && color.isString() ? color.asString() : null;
    }

    static Integer dimension(JSONB metadata, String name) {
        if (metadata == null) return null;
        var value = MAPPER.readTree(metadata.data()).get(name);
        return value != null && value.isInt() ? value.intValue() : null;
    }
}
