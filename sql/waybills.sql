CREATE TABLE waybills(
    id INT AUTO_INCREMENT, 
    order_number VARCHAR(64),
    order_id VARCHAR(128),
    waybill_file VARCHAR(64), 
    token VARCHAR(512), 
    tracking_number VARCHAR(128), 
    PRIMARY KEY (id)
)