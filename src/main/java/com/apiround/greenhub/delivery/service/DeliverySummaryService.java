package com.apiround.greenhub.delivery.service;

import com.apiround.greenhub.delivery.dto.DeliverySummaryDto;

public interface DeliverySummaryService {
    DeliverySummaryDto getSummaryForCompany(Integer companyId);
}
