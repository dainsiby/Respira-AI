from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer


@api_view(['GET'])
def test_api(request):
    return Response({
        "message": "RESPIRA AI API is working"
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
def patient_list_create(request):
    if request.method == 'GET':
        patients = Patient.objects.all()
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def patient_detail(request, pk):
    try:
        if str(pk).isdigit():
            patient = Patient.objects.get(pk=pk)
        else:
            patient = Patient.objects.get(patient_id=pk)
    except Patient.DoesNotExist:
        return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = PatientSerializer(patient)
    return Response(serializer.data, status=status.HTTP_200_OK)